import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'payment_webview_screen.dart';
import 'request_chat_screen.dart';

class ContractDetailScreen extends StatefulWidget {
  final String contractId;
  final String ownerUid;
  final bool isLandlord;

  const ContractDetailScreen({
    super.key,
    required this.contractId,
    required this.ownerUid,
    required this.isLandlord,
  });

  @override
  State<ContractDetailScreen> createState() => _ContractDetailScreenState();
}

class _ContractDetailScreenState extends State<ContractDetailScreen> {
  Map<String, dynamic>? _contract;
  List<Map<String, dynamic>> _invoices = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final contractDoc = await FirebaseFirestore.instance
          .collection('accounts')
          .doc(widget.ownerUid)
          .collection('contracts')
          .doc(widget.contractId)
          .get();

      if (contractDoc.exists) {
        _contract = contractDoc.data();
      }

      final invoicesSnap = await FirebaseFirestore.instance
          .collection('accounts')
          .doc(widget.ownerUid)
          .collection('contracts')
          .doc(widget.contractId)
          .collection('invoices')
          .orderBy('period')
          .get();

      _invoices = invoicesSnap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
    } catch (e) {
      debugPrint('Error loading contract: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _statusLabel(String status) {
    const labels = {
      'DUE': 'Bekliyor',
      'OVERDUE': 'Gecikmiş',
      'PAID': 'Ödendi',
      'PAYMENT_PENDING': 'İşlemde',
      'CLOSED_UPFRONT': 'Peşin Kapandı',
      'FAILED': 'Başarısız',
      'REFUNDED': 'İade Edildi',
      'TRANSFERRED': 'Yeni Sözleşmeden Devam',
    };
    return labels[status] ?? status;
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'PAID':
        return Colors.green;
      case 'DUE':
        return Colors.blue;
      case 'OVERDUE':
      case 'REFUNDED':
        return Colors.red;
      case 'PAYMENT_PENDING':
        return Colors.orange;
      case 'CLOSED_UPFRONT':
      case 'TRANSFERRED':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _resolveStatus(Map<String, dynamic> inv) {
    final status = inv['status'] as String? ?? 'DUE';
    if (status == 'DUE') {
      final dueDate = (inv['dueDate'] as Timestamp?)?.toDate();
      if (dueDate != null && DateTime.now().isAfter(dueDate)) {
        return 'OVERDUE';
      }
    }
    return status;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Sözleşme Detayı')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_contract == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Sözleşme Detayı')),
        body: const Center(child: Text('Sözleşme bulunamadı.')),
      );
    }

    final tenant = _contract!['tenant'] as Map<String, dynamic>? ?? {};
    final rent = _contract!['rentAmount'] ?? 0;
    final payDay = _contract!['payDay'] ?? 1;
    final lateFee = _contract!['lateFeeEnabled'] == true;
    final deposit = _contract!['depositAmount'] ?? 0;
    final status = _contract!['status'] as String? ?? 'DRAFT';
    final df = DateFormat('dd.MM.yyyy');

    return Scaffold(
      appBar: AppBar(title: const Text('Sözleşme Detayı')),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() => _loading = true);
          await _load();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Contract info card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Sözleşme Bilgileri',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 16),
                    _InfoRow(label: 'Kiracı', value: tenant['name'] ?? '—'),
                    _InfoRow(label: 'TCKN', value: tenant['tckn'] ?? '—'),
                    _InfoRow(label: 'E-posta', value: tenant['email'] ?? '—'),
                    _InfoRow(label: 'Aylık Kira', value: '$rent TL'),
                    _InfoRow(label: 'Ödeme Günü', value: 'Her ayın $payDay. günü'),
                    _InfoRow(label: 'Depozito', value: '$deposit TL'),
                    _InfoRow(
                      label: 'Gecikme Faizi',
                      value: lateFee ? 'Aktif (5 gün muaf, sonra %1/gün)' : 'Pasif',
                    ),
                    _InfoRow(label: 'Durum', value: _contractStatusLabel(status)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Requests section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Talepler', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text('Bu sözleşmeye ait talepler.', style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey)),
                    const SizedBox(height: 12),
                    StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('accounts/${widget.ownerUid}/contracts/${widget.contractId}/requests')
                          .orderBy('createdAt', descending: true)
                          .snapshots(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()));
                        }
                        final docs = snapshot.data?.docs ?? [];
                        if (docs.isEmpty) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16),
                            child: Center(child: Text('Henüz talep yok.', style: TextStyle(color: Colors.grey, fontSize: 13))),
                          );
                        }
                        return Column(
                          children: docs.map((d) {
                            final data = d.data() as Map<String, dynamic>;
                            final reqStatus = data['status'] as String? ?? 'PENDING';
                            final typeLabels = {
                              'REPAIR_REQUEST': 'Bakım / Onarım', 'DAMAGE_REQUEST': 'Hasar Talebi',
                              'PAYMENT_REQUEST': 'Ödeme Talebi', 'CONTACT_UPDATE': 'İletişim Güncelleme',
                              'RENEWAL_OFFER': 'Kira Artış Talebi', 'GENERAL_REQUEST': 'Genel Talep',
                            };
                            final statusColors = {'PENDING': Colors.orange, 'APPROVED': Colors.green, 'REJECTED': Colors.red};
                            final statusLabels = {'PENDING': 'Bekliyor', 'APPROVED': 'Onaylandı', 'REJECTED': 'Reddedildi'};
                            final sColor = statusColors[reqStatus] ?? Colors.grey;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(typeLabels[data['type']] ?? data['type'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                        decoration: BoxDecoration(color: sColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                                        child: Text(statusLabels[reqStatus] ?? reqStatus, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: sColor)),
                                      ),
                                    ],
                                  ),
                                  if (data['message'] != null && (data['message'] as String).isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(data['message'], style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)), maxLines: 2, overflow: TextOverflow.ellipsis),
                                    ),
                                  if (data['amount'] != null && data['amount'] != 0)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text('${data['amount']} TL', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF3B82F6))),
                                    ),
                                  if (data['images'] != null && (data['images'] as List).isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 6),
                                      child: SizedBox(
                                        height: 50,
                                        child: ListView.separated(
                                          scrollDirection: Axis.horizontal,
                                          itemCount: (data['images'] as List).length,
                                          separatorBuilder: (_, __) => const SizedBox(width: 4),
                                          itemBuilder: (_, i) => ClipRRect(
                                            borderRadius: BorderRadius.circular(6),
                                            child: Image.network((data['images'] as List)[i], width: 50, height: 50, fit: BoxFit.cover),
                                          ),
                                        ),
                                      ),
                                    ),
                                  if (reqStatus == 'PENDING')
                                    Padding(
                                      padding: const EdgeInsets.only(top: 8),
                                      child: SizedBox(
                                        height: 32,
                                        width: double.infinity,
                                        child: OutlinedButton.icon(
                                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => RequestChatScreen(
                                            ownerUid: widget.ownerUid,
                                            contractId: widget.contractId,
                                            requestId: d.id,
                                            requestType: data['type'] ?? '',
                                            requestStatus: reqStatus,
                                          ))),
                                          icon: const Icon(Icons.chat_bubble_outline, size: 14),
                                          label: const Text('Sohbet', style: TextStyle(fontSize: 11)),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            );
                          }).toList(),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Invoices section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.isLandlord ? 'Ödeme Durumları' : 'Faturalarım',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    if (widget.isLandlord)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          'Kiracının aylık ödeme durumları.',
                          style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
                        ),
                      ),
                    const SizedBox(height: 12),
                    if (_invoices.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Center(
                          child: Text('Henüz fatura oluşturulmamış.',
                              style: TextStyle(color: Colors.grey)),
                        ),
                      )
                    else
                      ..._invoices.map((inv) {
                        final resolvedStatus = _resolveStatus(inv);
                        final dueDate = (inv['dueDate'] as Timestamp?)?.toDate();
                        final total = inv['tenantTotal'] ?? 0;
                        final color = _statusColor(resolvedStatus);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: resolvedStatus == 'OVERDUE'
                                ? Colors.red.shade50
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      inv['period'] ?? '—',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600, fontSize: 14),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      dueDate != null
                                          ? 'Son ödeme: ${df.format(dueDate)}'
                                          : 'Son ödeme: —',
                                      style: TextStyle(
                                          fontSize: 12, color: Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${NumberFormat('#,###', 'tr_TR').format(total)} ₺',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w700, fontSize: 14),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: color.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      _statusLabel(resolvedStatus),
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: color,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              // Pay button only for tenant
                              if (!widget.isLandlord &&
                                  (resolvedStatus == 'DUE' || resolvedStatus == 'OVERDUE' || resolvedStatus == 'FAILED' || resolvedStatus == 'PAYMENT_PENDING' || resolvedStatus == 'REFUNDED'))
                                Padding(
                                  padding: const EdgeInsets.only(left: 8),
                                  child: SizedBox(
                                    height: 36,
                                    child: ElevatedButton(
                                      onPressed: () => _startPayment(inv),
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                        textStyle: const TextStyle(fontSize: 13),
                                      ),
                                      child: Text(resolvedStatus == 'REFUNDED' ? 'Tekrar Öde' : resolvedStatus == 'FAILED' ? 'Tekrar Öde' : 'Öde'),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Fixtures
            if (_contract!['fixtures'] != null && (_contract!['fixtures'] as List).isNotEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Demirbaş Listesi', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('${(_contract!['fixtures'] as List).length} adet demirbaş kayıtlı.', style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey)),
                      const SizedBox(height: 12),
                      ...(_contract!['fixtures'] as List).asMap().entries.map((e) {
                        final i = e.key;
                        final f = e.value as Map<String, dynamic>;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              Text('${i + 1}.', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                              const SizedBox(width: 8),
                              Expanded(child: Text(f['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(4)),
                                child: Text(f['condition'] ?? '', style: const TextStyle(fontSize: 10)),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Clauses
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Sözleşme Maddeleri', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    _ClauseRow(num: 1, text: 'Kira bedeli her ayın $payDay. günü ödenir.'),
                    _ClauseRow(num: 2, text: 'Aylık kira bedeli $rent TL\'dir.'),
                    if (deposit > 0)
                      _ClauseRow(num: 3, text: 'Depozito bedeli $deposit TL\'dir.'),
                    _ClauseRow(
                      num: deposit > 0 ? 4 : 3,
                      text: lateFee
                          ? 'Ödeme gecikirse ilk 5 gün faiz uygulanmaz; 6. günden itibaren günlük %1 faiz uygulanır.'
                          : 'Ödeme gecikmelerinde faiz uygulanmaz.',
                    ),
                    if (_contract!['clauses'] != null)
                      ...(_contract!['clauses'] as List).asMap().entries.map((e) {
                        final baseNum = (deposit > 0 ? 5 : 4) + e.key;
                        return _ClauseRow(num: baseNum, text: e.value.toString());
                      }),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _startPayment(Map<String, dynamic> invoice) async {
    try {
      final token = await FirebaseAuth.instance.currentUser?.getIdToken();
      if (token == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Oturum bulunamadı.')),
          );
        }
        return;
      }

      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PaymentWebViewScreen(
            ownerUid: widget.ownerUid,
            contractId: widget.contractId,
            invoiceId: invoice['id'] as String,
            authToken: token,
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
        );
      }
    }
  }

  String _contractStatusLabel(String status) {
    const labels = {
      'DRAFT': 'Taslak',
      'DRAFT_READY': 'Hazır',
      'EDEVLET_TRANSFERRED': 'e-Devlet\'e Aktarıldı',
      'EDEVLET_PENDING': 'Onay Bekliyor',
      'EDEVLET_APPROVED': 'Onaylandı',
      'ACTIVE': 'Aktif',
      'TERMINATED': 'Sonlandırıldı',
      'CANCELLED': 'İptal',
    };
    return labels[status] ?? status;
  }
}

class _ClauseRow extends StatelessWidget {
  final int num;
  final String text;
  const _ClauseRow({required this.num, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFDBEAFE),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Center(
              child: Text('$num', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF3B82F6))),
            ),
          ),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 12, color: Color(0xFF475569)))),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade600,
              ),
            ),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
