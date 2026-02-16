import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';

class PayoutsScreen extends StatefulWidget {
  final String activeRole;
  const PayoutsScreen({super.key, this.activeRole = 'landlord'});

  @override
  State<PayoutsScreen> createState() => _PayoutsScreenState();
}

class _PayoutsScreenState extends State<PayoutsScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _payouts = [];
  double _walletBalance = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant PayoutsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeRole != widget.activeRole) _load();
  }

  Future<void> _load() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    setState(() => _loading = true);

    try {
      // Wallet balance
      final walletSnap = await FirebaseFirestore.instance
          .collection('accounts/${user.uid}/wallet')
          .get();
      double balance = 0;
      for (final d in walletSnap.docs) {
        final amount = (d.data()['amount'] as num?)?.toDouble() ?? 0;
        balance += amount;
      }

      // Payouts
      final payoutsSnap = await FirebaseFirestore.instance
          .collection('accounts/${user.uid}/payouts')
          .orderBy('createdAt', descending: true)
          .get();
      final payouts = payoutsSnap.docs
          .map((d) => {'id': d.id, ...d.data()})
          .toList();

      if (mounted) {
        setState(() {
          _walletBalance = balance;
          _payouts = payouts;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Payouts load error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'PLANNED':
        return 'Planlandı';
      case 'TRANSFERRED':
        return 'Aktarıldı';
      default:
        return status ?? '—';
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'TRANSFERRED':
        return const Color(0xFF22C55E);
      case 'PLANNED':
        return const Color(0xFFF59E0B);
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final nf = NumberFormat('#,###', 'tr_TR');
    final df = DateFormat('dd.MM.yyyy');

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (widget.activeRole == 'tenant') {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.account_balance_wallet_outlined, size: 64, color: Colors.grey.shade300),
              const SizedBox(height: 16),
              const Text(
                'Aktarımlar sadece ev sahipleri için geçerlidir.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Wallet balance card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  theme.colorScheme.primary,
                  theme.colorScheme.primary.withValues(alpha: 0.85),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.primary.withValues(alpha: 0.25),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Cüzdan Bakiyesi', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.8))),
                const SizedBox(height: 8),
                Text(
                  '${nf.format(_walletBalance)} ₺',
                  style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text('Aktarım Geçmişi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurface)),
          const SizedBox(height: 12),

          if (_payouts.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.account_balance_wallet_outlined, size: 48, color: Colors.grey.shade300),
                      const SizedBox(height: 12),
                      const Text('Henüz aktarım yok', style: TextStyle(color: Color(0xFF64748B))),
                    ],
                  ),
                ),
              ),
            )
          else
            ..._payouts.map((p) {
              final status = p['status'] as String? ?? 'PLANNED';
              final amount = (p['amount'] as num?)?.toDouble() ?? 0;
              final plannedAt = (p['plannedAt'] as Timestamp?)?.toDate();
              final color = _statusColor(status);

              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          status == 'TRANSFERRED' ? Icons.check_circle_outline : Icons.schedule,
                          color: color,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${nf.format(amount)} ₺',
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              plannedAt != null ? 'Planlanan: ${df.format(plannedAt)}' : '—',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _statusLabel(status),
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}
