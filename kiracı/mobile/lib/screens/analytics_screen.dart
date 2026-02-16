import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

class AnalyticsScreen extends StatefulWidget {
  final String activeRole;
  const AnalyticsScreen({super.key, this.activeRole = 'landlord'});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  bool _loading = true;
  Map<String, dynamic> _stats = {
    'totalRevenue': 0.0,
    'monthlyRevenue': 0.0,
    'activeContracts': 0,
    'pendingPayments': 0,
    'paidInvoices': 0,
    'overdueInvoices': 0,
    'revenueByMonth': <Map<String, dynamic>>[],
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant AnalyticsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeRole != widget.activeRole) _load();
  }

  Future<void> _load() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _loading = true);

    try {
      // Contracts
      final contractsSnap = await FirebaseFirestore.instance
          .collection('accounts/${user.uid}/contracts')
          .get();

      final activeContracts = contractsSnap.docs
          .where((d) => ['ACTIVE', 'EDEVLET_APPROVED'].contains(d.data()['status']))
          .length;

      // Invoices
      final allInvoices = <Map<String, dynamic>>[];
      for (final contractDoc in contractsSnap.docs) {
        final invoicesSnap = await FirebaseFirestore.instance
            .collection('accounts/${user.uid}/contracts/${contractDoc.id}/invoices')
            .get();
        allInvoices.addAll(invoicesSnap.docs.map((d) => {'id': d.id, ...d.data()}));
      }

      final paidInvoices = allInvoices.where((inv) => inv['status'] == 'PAID').length;
      final overdueInvoices = allInvoices.where((inv) => inv['status'] == 'OVERDUE').length;
      final pendingPayments = allInvoices.where((inv) => ['DUE', 'OVERDUE'].contains(inv['status'])).length;

      // Revenue
      final totalRevenue = allInvoices
          .where((inv) => inv['status'] == 'PAID')
          .fold<double>(0, (sum, inv) => sum + ((inv['landlordNet'] as num?)?.toDouble() ?? 0));

      final now = DateTime.now();
      final currentMonth = '${now.year}-${now.month.toString().padLeft(2, '0')}';
      final monthlyRevenue = allInvoices
          .where((inv) => inv['status'] == 'PAID' && inv['period'] == currentMonth)
          .fold<double>(0, (sum, inv) => sum + ((inv['landlordNet'] as num?)?.toDouble() ?? 0));

      // Revenue by month (last 6 months)
      final monthsMap = <String, double>{};
      for (int i = 5; i >= 0; i--) {
        final date = DateTime(now.year, now.month - i, 1);
        final key = '${date.year}-${date.month.toString().padLeft(2, '0')}';
        monthsMap[key] = 0;
      }

      for (final inv in allInvoices) {
        if (inv['status'] == 'PAID' && inv['period'] != null) {
          if (monthsMap.containsKey(inv['period'])) {
            monthsMap[inv['period']] = monthsMap[inv['period']]! + ((inv['landlordNet'] as num?)?.toDouble() ?? 0);
          }
        }
      }

      final revenueByMonth = monthsMap.entries
          .map((e) => {'month': e.key, 'amount': e.value})
          .toList();

      if (mounted) {
        setState(() {
          _stats = {
            'totalRevenue': totalRevenue,
            'monthlyRevenue': monthlyRevenue,
            'activeContracts': activeContracts,
            'pendingPayments': pendingPayments,
            'paidInvoices': paidInvoices,
            'overdueInvoices': overdueInvoices,
            'revenueByMonth': revenueByMonth,
          };
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Analytics load error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatCurrency(double amount) {
    return NumberFormat.currency(locale: 'tr_TR', symbol: '₺', decimalDigits: 0).format(amount);
  }

  String _getMonthName(String period) {
    try {
      final parts = period.split('-');
      final date = DateTime(int.parse(parts[0]), int.parse(parts[1]));
      return DateFormat('MMM yy', 'tr_TR').format(date);
    } catch (e) {
      return period;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
              Icon(Icons.analytics_outlined, size: 64, color: Colors.grey.shade300),
              const SizedBox(height: 16),
              const Text(
                'Analizler sadece ev sahipleri için geçerlidir.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15, color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
      );
    }

    final revenueData = _stats['revenueByMonth'] as List<Map<String, dynamic>>;
    final maxRevenue = revenueData.fold<double>(1, (max, item) => item['amount'] > max ? item['amount'] : max);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Key Metrics
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  title: 'Toplam Gelir',
                  value: _formatCurrency(_stats['totalRevenue']),
                  icon: Icons.account_balance_wallet,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF14B8A6), Color(0xFF0D9488)],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _MetricCard(
                  title: 'Bu Ay',
                  value: _formatCurrency(_stats['monthlyRevenue']),
                  icon: Icons.calendar_today,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  title: 'Aktif Sözleşme',
                  value: '${_stats['activeContracts']}',
                  icon: Icons.description,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFA855F7), Color(0xFF9333EA)],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _MetricCard(
                  title: 'Bekleyen',
                  value: '${_stats['pendingPayments']}',
                  icon: Icons.schedule,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF97316), Color(0xFFEA580C)],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Revenue Chart
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Son 6 Ay Gelir Trendi',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 24),
                  ...revenueData.map((item) {
                    final percentage = (item['amount'] / maxRevenue * 100).clamp(0, 100);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _getMonthName(item['month']),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                              ),
                              Text(
                                _formatCurrency(item['amount']),
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: percentage / 100,
                              minHeight: 8,
                              backgroundColor: theme.colorScheme.surfaceContainerHighest,
                              valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary),
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

          // Summary Cards
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Icon(Icons.check_circle, color: Colors.green.shade600, size: 32),
                        const SizedBox(height: 8),
                        Text(
                          '${_stats['paidInvoices']}',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Ödenen',
                          style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Icon(Icons.error, color: Colors.red.shade600, size: 32),
                        const SizedBox(height: 8),
                        Text(
                          '${_stats['overdueInvoices']}',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Gecikmiş',
                          style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Gradient gradient;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.white.withValues(alpha: 0.9), size: 24),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.white.withValues(alpha: 0.85),
            ),
          ),
        ],
      ),
    );
  }
}
