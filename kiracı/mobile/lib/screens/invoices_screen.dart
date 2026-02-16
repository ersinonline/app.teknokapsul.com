import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'payment_webview_screen.dart';

class InvoicesScreen extends StatefulWidget {
  final String activeRole;
  const InvoicesScreen({super.key, this.activeRole = 'tenant'});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  List<Map<String, dynamic>> _invoices = [];
  bool _loading = true;
  bool _checkedPayments = false;

  @override
  void initState() {
    super.initState();
    _fetchInvoices();
  }

  @override
  void didUpdateWidget(covariant InvoicesScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeRole != widget.activeRole) {
      _checkedPayments = false;
      _fetchInvoices();
    }
  }

  Future<void> _fetchInvoices() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _loading = true);

    try {
      final List<Map<String, dynamic>> all = [];

      if (widget.activeRole == 'tenant') {
        // Kiracı olarak gelen faturalar
        if (user.email != null && user.email!.isNotEmpty) {
          final tenantSnap = await FirebaseFirestore.instance
              .collectionGroup('invoices')
              .where('tenantEmail', isEqualTo: user.email)
              .get();

          for (final doc in tenantSnap.docs) {
            final parts = doc.reference.path.split('/');
            if (parts.length >= 6 && parts[0] == 'accounts' && parts[2] == 'contracts') {
              final ownerUid = parts[1];
              final contractId = parts[3];
              if (ownerUid != user.uid) {
                all.add({
                  'id': doc.id,
                  'ownerUid': ownerUid,
                  'contractId': contractId,
                  ...doc.data(),
                });
              }
            }
          }
        }
      } else {
        // Ev sahibi olarak faturalar
        final contractsSnap = await FirebaseFirestore.instance
            .collection('accounts/${user.uid}/contracts')
            .get();
        for (final c in contractsSnap.docs) {
          final invSnap = await FirebaseFirestore.instance
              .collection('accounts/${user.uid}/contracts/${c.id}/invoices')
              .get();
          for (final inv in invSnap.docs) {
            all.add({
              'id': inv.id,
              'ownerUid': user.uid,
              'contractId': c.id,
              ...inv.data(),
            });
          }
        }
      }

      final statusOrder = {'REFUNDED': 0, 'OVERDUE': 1, 'FAILED': 2, 'DUE': 3, 'PAYMENT_PENDING': 4, 'PAID': 5, 'CLOSED_UPFRONT': 6, 'TRANSFERRED': 7};
      all.sort((a, b) {
        final sa = _resolveStatus(a);
        final sb = _resolveStatus(b);
        return (statusOrder[sa] ?? 9).compareTo(statusOrder[sb] ?? 9);
      });

      if (mounted) setState(() => _invoices = all);
    } catch (e) {
      debugPrint('Error fetching invoices: $e');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
        _checkPendingPayments();
      }
    }
  }

  Future<void> _checkPendingPayments() async {
    if (_checkedPayments || _invoices.isEmpty) return;
    _checkedPayments = true;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final token = await user.getIdToken();
    if (token == null) return;

    final pending = _invoices.where((inv) {
      final s = inv['status'] as String? ?? '';
      final hasToken = inv['iyzico'] != null && (inv['iyzico'] as Map)['checkoutToken'] != null;
      return s != 'PAID' && hasToken;
    }).toList();

    if (pending.isEmpty) return;

    bool anyChanged = false;
    for (final inv in pending) {
      try {
        final resp = await http.post(
          Uri.parse('https://us-central1-superapp-37db4.cloudfunctions.net/checkPaymentStatus'),
          headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
          body: jsonEncode({
            'ownerUid': inv['ownerUid'],
            'contractId': inv['contractId'],
            'invoiceId': inv['id'],
          }),
        );
        if (resp.statusCode == 200) {
          final data = jsonDecode(resp.body);
          if (data['changed'] == true && data['status'] != null) {
            anyChanged = true;
            if (mounted) {
              setState(() {
                final idx = _invoices.indexWhere((x) =>
                    x['id'] == inv['id'] && x['contractId'] == inv['contractId'] && x['ownerUid'] == inv['ownerUid']);
                if (idx >= 0) _invoices[idx]['status'] = data['status'];
              });
            }
          }
        }
      } catch (e) {
        debugPrint('checkPaymentStatus error: $e');
      }
    }

    if (anyChanged && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ödeme durumu güncellendi.'), backgroundColor: Color(0xFF0F766E)),
      );
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

  bool _canPay(String status) {
    return status == 'DUE' || status == 'OVERDUE' || status == 'FAILED' || status == 'PAYMENT_PENDING' || status == 'REFUNDED';
  }

  String _statusLabel(String status) {
    const labels = {
      'DUE': 'Bekliyor',
      'OVERDUE': 'Gecikmiş',
      'PAID': 'Ödendi',
      'PAYMENT_PENDING': 'İşlemde',
      'FAILED': 'Başarısız',
      'REFUNDED': 'İade Edildi',
      'CLOSED_UPFRONT': 'Peşin Kapandı',
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
      case 'FAILED':
      case 'REFUNDED':
        return Colors.red;
      case 'PAYMENT_PENDING':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final df = DateFormat('dd.MM.yyyy');
    final nf = NumberFormat('#,###', 'tr_TR');

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final overdueInvoices = _invoices.where((i) => _resolveStatus(i) == 'OVERDUE').toList();

    return RefreshIndicator(
      onRefresh: () async {
        _checkedPayments = false;
        await _fetchInvoices();
      },
      child: _invoices.isEmpty
          ? ListView(
              children: [
                const SizedBox(height: 120),
                Center(
                  child: Column(
                    children: [
                      Icon(Icons.payment_outlined, size: 64, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      Text(
                        widget.activeRole == 'landlord'
                            ? 'Kiracılarınızın fatura durumları burada görünecek'
                            : 'Henüz fatura bulunmuyor',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 15),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Aktif sözleşmeleriniz için faturalar\notomatik oluşturulacaktır.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Overdue warning banner
                if (overdueInvoices.isNotEmpty && widget.activeRole == 'tenant')
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Colors.red.shade600),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${overdueInvoices.length} adet gecikmiş ödemeniz var!',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: Colors.red.shade800,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'İlk 5 gün muaf, sonrasında günlük %1 gecikme cezası uygulanır.',
                                style: TextStyle(
                                  color: Colors.red.shade600,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                // Refund warning banner
                if (_invoices.any((i) => _resolveStatus(i) == 'REFUNDED') && widget.activeRole == 'tenant')
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.orange.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.replay, color: Colors.orange.shade600),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${_invoices.where((i) => _resolveStatus(i) == 'REFUNDED').length} adet iade edilmiş ödemeniz var',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: Colors.orange.shade800,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'iyzico üzerinden iade yapıldı, tekrar ödeme yapmanız gerekiyor.',
                                style: TextStyle(
                                  color: Colors.orange.shade600,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                // Invoice cards
                ..._invoices.map((inv) {
                  final resolvedStatus = _resolveStatus(inv);
                  final dueDate = (inv['dueDate'] as Timestamp?)?.toDate();
                  final total = inv['tenantTotal'] ?? 0;
                  final color = _statusColor(resolvedStatus);
                  final showPayBtn = widget.activeRole == 'tenant' && _canPay(resolvedStatus);

                  return Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    color: resolvedStatus == 'OVERDUE'
                        ? Colors.red.shade50
                        : resolvedStatus == 'FAILED'
                            ? Colors.red.shade50
                            : null,
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      inv['period'] ?? '—',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w700, fontSize: 15),
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
                                    '${nf.format(total)} ₺',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 16,
                                      color: resolvedStatus == 'OVERDUE' || resolvedStatus == 'FAILED'
                                          ? Colors.red.shade700
                                          : theme.colorScheme.onSurface,
                                    ),
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
                            ],
                          ),
                          if (showPayBtn) ...[
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () => _startPayment(inv),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: theme.colorScheme.primary,
                                  foregroundColor: theme.colorScheme.onPrimary,
                                ),
                                child: Text(
                                  resolvedStatus == 'REFUNDED' ? 'Tekrar Öde (İade)' : resolvedStatus == 'FAILED' ? 'Tekrar Öde (Kredi Kartı)' : 'Öde (Kredi Kartı)',
                                  style: const TextStyle(fontWeight: FontWeight.w600),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                }),
              ],
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
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => PaymentWebViewScreen(
            ownerUid: invoice['ownerUid'] as String,
            contractId: invoice['contractId'] as String,
            invoiceId: invoice['id'] as String,
            authToken: token,
          ),
        ),
      );

      if (result == true) {
        _checkedPayments = false;
        _fetchInvoices();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
        );
      }
    }
  }
}
