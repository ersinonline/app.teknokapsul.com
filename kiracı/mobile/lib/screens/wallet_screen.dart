import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _entries = [];
  List<Map<String, dynamic>> _withdrawals = [];

  double _blockedTotal = 0;
  double _availableTotal = 0;
  double _withdrawnTotal = 0;
  double _refundedTotal = 0;

  bool _showWithdrawForm = false;
  bool _withdrawBusy = false;
  final _amountCtrl = TextEditingController();
  final _ibanCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchWallet();
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _ibanCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchWallet() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    setState(() => _loading = true);

    try {
      final payoutsSnap = await FirebaseFirestore.instance
          .collection('accounts/${user.uid}/payouts')
          .get();

      final now = DateTime.now();
      final items = <Map<String, dynamic>>[];
      double blocked = 0, available = 0, withdrawn = 0, refunded = 0;

      for (final d in payoutsSnap.docs) {
        final data = d.data();
        final paidAt = (data['createdAt'] as Timestamp?)?.toDate() ?? now;
        final releaseDate = (data['plannedAt'] as Timestamp?)?.toDate() ??
            paidAt.add(const Duration(days: 8));
        final amount = (data['amount'] as num?)?.toDouble() ?? 0;

        String status;
        if (data['status'] == 'REFUNDED' || data['invoiceStatus'] == 'REFUNDED') {
          status = 'REFUNDED';
          refunded += amount;
        } else if (data['status'] == 'TRANSFERRED') {
          status = 'WITHDRAWN';
          withdrawn += amount;
        } else if (now.isAfter(releaseDate)) {
          status = 'AVAILABLE';
          available += amount;
        } else {
          status = 'BLOCKED';
          blocked += amount;
        }

        String period = 'Kira Tahsilatı';
        if (data['type'] == 'UPFRONT') {
          period = 'Peşin Ödeme';
        } else if (data['invoiceId'] != null) {
          period = '${data['invoiceId']} Dönemi';
        }

        items.add({
          'id': d.id,
          'amount': amount,
          'paidAt': paidAt,
          'releaseDate': releaseDate,
          'status': status,
          'period': period,
        });
      }

      items.sort((a, b) => (b['paidAt'] as DateTime).compareTo(a['paidAt'] as DateTime));

      // Withdrawals
      final wSnap = await FirebaseFirestore.instance
          .collection('accounts/${user.uid}/withdrawals')
          .get();
      final wItems = wSnap.docs.map((d) => {'id': d.id, ...d.data()}).toList();

      if (mounted) {
        setState(() {
          _entries = items;
          _withdrawals = wItems;
          _blockedTotal = blocked;
          _availableTotal = available;
          _withdrawnTotal = withdrawn;
          _refundedTotal = refunded;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Wallet fetch error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleWithdraw() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final amount = double.tryParse(_amountCtrl.text) ?? 0;
    if (amount <= 0) { _showMsg('Geçerli bir tutar girin.', true); return; }
    if (amount > _availableTotal) { _showMsg('Kullanılabilir bakiyeniz yetersiz.', true); return; }
    if (_ibanCtrl.text.trim().isEmpty) { _showMsg('IBAN girin.', true); return; }

    setState(() => _withdrawBusy = true);
    try {
      final data = {
        'amount': amount,
        'iban': _ibanCtrl.text.trim(),
        'status': 'PENDING',
        'createdAt': FieldValue.serverTimestamp(),
        'uid': user.uid,
        'displayName': user.displayName ?? user.email,
      };
      await FirebaseFirestore.instance.collection('accounts/${user.uid}/withdrawals').add(data);
      await FirebaseFirestore.instance.collection('admin_withdrawals').add(data);

      _showMsg('Para çekme talebi oluşturuldu!', false);
      _amountCtrl.clear();
      _ibanCtrl.clear();
      setState(() => _showWithdrawForm = false);
      _fetchWallet();
    } catch (e) {
      _showMsg('Hata: $e', true);
    } finally {
      if (mounted) setState(() => _withdrawBusy = false);
    }
  }

  void _showMsg(String msg, bool isError) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: isError ? const Color(0xFFEF4444) : const Color(0xFF0F766E)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final nf = NumberFormat('#,###', 'tr_TR');
    final df = DateFormat('dd.MM.yyyy');

    if (_loading) return const Center(child: CircularProgressIndicator());

    return RefreshIndicator(
      onRefresh: _fetchWallet,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Refund alert
          if (_refundedTotal > 0)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFFED7AA)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(color: const Color(0xFFFFEDD5), borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.replay, color: Color(0xFFEA580C), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${nf.format(_refundedTotal.round())} ₺ iade edildi', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF9A3412))),
                        const Text('iyzico üzerinden iade yapıldı.', style: TextStyle(fontSize: 11, color: Color(0xFFEA580C))),
                      ],
                    ),
                  ),
                ],
              ),
            ),

          // Balance cards
          Row(
            children: [
              Expanded(child: _BalanceCard(label: 'Blokeli', amount: nf.format(_blockedTotal.round()), color: const Color(0xFFF59E0B), icon: Icons.lock_clock)),
              const SizedBox(width: 10),
              Expanded(child: _BalanceCard(label: 'Kullanılabilir', amount: nf.format(_availableTotal.round()), color: const Color(0xFF10B981), icon: Icons.check_circle_outline)),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _BalanceCard(label: 'Çekilen', amount: nf.format(_withdrawnTotal.round()), color: const Color(0xFF64748B), icon: Icons.arrow_upward)),
              const SizedBox(width: 10),
              if (_refundedTotal > 0)
                Expanded(child: _BalanceCard(label: 'İade', amount: '-${nf.format(_refundedTotal.round())}', color: const Color(0xFFEF4444), icon: Icons.undo))
              else
                const Expanded(child: SizedBox()),
            ],
          ),
          const SizedBox(height: 16),

          // Withdraw button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: () => setState(() => _showWithdrawForm = !_showWithdrawForm),
              icon: Icon(_showWithdrawForm ? Icons.close : Icons.account_balance_wallet_outlined, size: 18),
              label: Text(_showWithdrawForm ? 'İptal' : 'Para Çekme Talebi', style: const TextStyle(fontWeight: FontWeight.w600)),
              style: OutlinedButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),

          // Withdraw form
          if (_showWithdrawForm) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDFA),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF99F6E4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Para Çekme Talebi', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F766E))),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _amountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Tutar (₺)',
                      hintText: 'Maks: ${nf.format(_availableTotal.round())} ₺',
                      prefixIcon: const Icon(Icons.payments_outlined, size: 18),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _ibanCtrl,
                    decoration: const InputDecoration(
                      labelText: 'IBAN',
                      hintText: 'TR00 0000 0000 0000 0000 0000 00',
                      prefixIcon: Icon(Icons.account_balance, size: 18),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _withdrawBusy ? null : _handleWithdraw,
                      style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                      child: _withdrawBusy
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Talep Oluştur', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Entries
          const Text('Gelen Ödemeler & Aktarımlar', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
          const SizedBox(height: 4),
          const Text('Kiracılardan gelen ödemeler ve aktarım durumları.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
          const SizedBox(height: 12),

          if (_entries.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14)),
              child: const Center(child: Text('Henüz işlem yok.', style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8)))),
            )
          else
            ..._entries.map((e) {
              final status = e['status'] as String;
              final amount = (e['amount'] as double).round();
              final paidAt = e['paidAt'] as DateTime;
              final releaseDate = e['releaseDate'] as DateTime;

              Color statusColor;
              String statusLabel;
              IconData statusIcon;
              switch (status) {
                case 'BLOCKED':
                  statusColor = const Color(0xFFF59E0B);
                  statusLabel = 'Blokeli';
                  statusIcon = Icons.lock_clock;
                  break;
                case 'AVAILABLE':
                  statusColor = const Color(0xFF10B981);
                  statusLabel = 'Kullanılabilir';
                  statusIcon = Icons.check_circle_outline;
                  break;
                case 'WITHDRAWN':
                  statusColor = const Color(0xFF64748B);
                  statusLabel = 'Aktarıldı';
                  statusIcon = Icons.arrow_upward;
                  break;
                case 'REFUNDED':
                  statusColor = const Color(0xFFEF4444);
                  statusLabel = 'İade Edildi';
                  statusIcon = Icons.undo;
                  break;
                default:
                  statusColor = const Color(0xFF94A3B8);
                  statusLabel = status;
                  statusIcon = Icons.help_outline;
              }

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                      child: Icon(statusIcon, color: statusColor, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(e['period'] as String, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0F172A))),
                          const SizedBox(height: 2),
                          Text(
                            status == 'BLOCKED'
                                ? 'Giriş: ${df.format(paidAt)} • Aktarım: ${df.format(releaseDate)}'
                                : 'Giriş: ${df.format(paidAt)}',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('${nf.format(amount)} ₺', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                          child: Text(statusLabel, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: statusColor)),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),

          // Withdrawals
          if (_withdrawals.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text('Para Çekme Talepleri', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
            const SizedBox(height: 12),
            ..._withdrawals.map((w) {
              final wStatus = w['status'] as String? ?? 'PENDING';
              final wAmount = (w['amount'] as num?)?.toDouble() ?? 0;
              final isSent = wStatus == 'SENT';
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${nf.format(wAmount.round())} ₺', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                          if (w['iban'] != null)
                            Text(w['iban'], style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isSent ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isSent ? 'Gönderildi' : 'Bekleniyor',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isSent ? const Color(0xFF16A34A) : const Color(0xFFD97706)),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final String label;
  final String amount;
  final Color color;
  final IconData icon;
  const _BalanceCard({required this.label, required this.amount, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color, letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 8),
          Text('$amount ₺', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
        ],
      ),
    );
  }
}
