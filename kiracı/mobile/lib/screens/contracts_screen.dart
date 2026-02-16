import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'contract_detail_screen.dart';
import 'add_contract_screen.dart';

class ContractsScreen extends StatefulWidget {
  final String activeRole;
  const ContractsScreen({super.key, this.activeRole = 'landlord'});

  @override
  State<ContractsScreen> createState() => _ContractsScreenState();
}

class _ContractsScreenState extends State<ContractsScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _contracts = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant ContractsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeRole != widget.activeRole) _load();
  }

  Future<void> _load() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    setState(() => _loading = true);

    try {
      final items = <Map<String, dynamic>>[];

      if (widget.activeRole == 'landlord') {
        final snap = await FirebaseFirestore.instance
            .collection('accounts/${user.uid}/contracts')
            .get();
        for (final d in snap.docs) {
          items.add({'id': d.id, 'ownerUid': user.uid, 'isLandlord': true, ...d.data()});
        }
      } else {
        if (user.email != null) {
          final snap = await FirebaseFirestore.instance
              .collectionGroup('contracts')
              .where('tenant.email', isEqualTo: user.email)
              .get();
          for (final d in snap.docs) {
            final parts = d.reference.path.split('/');
            final ownerUid = parts.length >= 2 ? parts[1] : '';
            items.add({'id': d.id, 'ownerUid': ownerUid, 'isLandlord': false, ...d.data()});
          }
        }
      }

      // Sort: ACTIVE first, then by status
      const order = {'ACTIVE': 0, 'EDEVLET_APPROVED': 1, 'DRAFT_READY': 2, 'EDEVLET_PENDING': 3, 'EDEVLET_TRANSFERRED': 4, 'DRAFT': 5, 'TERMINATED': 6, 'CANCELLED': 7};
      items.sort((a, b) => (order[a['status']] ?? 9).compareTo(order[b['status']] ?? 9));

      if (mounted) setState(() { _contracts = items; _loading = false; });
    } catch (e) {
      debugPrint('Contracts load error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLandlord = widget.activeRole == 'landlord';
    final activeCount = _contracts.where((c) {
      final s = c['status'];
      return s == 'ACTIVE' || s == 'EDEVLET_APPROVED' || s == 'DRAFT_READY';
    }).length;

    if (_loading) return const Center(child: CircularProgressIndicator());

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: _contracts.isEmpty
            ? ListView(children: [
                const SizedBox(height: 100),
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 72, height: 72,
                        decoration: BoxDecoration(color: const Color(0xFFF1F5F9), shape: BoxShape.circle),
                        child: const Icon(Icons.description_outlined, size: 36, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        isLandlord ? 'Henüz sözleşmeniz yok' : 'Henüz kiracı sözleşmeniz yok',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        isLandlord ? 'Yeni sözleşme ekleyerek başlayın.' : 'Ev sahibiniz sözleşme oluşturduğunda burada görünecek.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ),
              ])
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Stats bar
                  Container(
                    padding: const EdgeInsets.all(14),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [
                        isLandlord ? const Color(0xFF0D9488) : const Color(0xFF3B82F6),
                        isLandlord ? const Color(0xFF14B8A6) : const Color(0xFF60A5FA),
                      ]),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.description, color: Colors.white, size: 20),
                        const SizedBox(width: 10),
                        Text(
                          '$activeCount aktif / ${_contracts.length} toplam sözleşme',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  ..._contracts.map((c) => _buildContractCard(c, theme)),
                ],
              ),
      ),
      floatingActionButton: isLandlord
          ? FloatingActionButton.extended(
              onPressed: () async {
                final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const AddContractScreen()));
                if (result == true) _load();
              },
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Yeni Sözleşme', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            )
          : null,
    );
  }

  Widget _buildContractCard(Map<String, dynamic> c, ThemeData theme) {
    final tenant = c['tenant'] as Map<String, dynamic>? ?? {};
    final status = c['status'] as String? ?? 'DRAFT';
    final rent = c['rentAmount'] ?? 0;
    final isLandlord = c['isLandlord'] == true;
    final startDate = (c['startDate'] as Timestamp?)?.toDate();
    final df = DateFormat('dd.MM.yyyy');

    final statusLabel = _statusLabel(status);
    final statusColor = _statusColor(status);

    return GestureDetector(
      onTap: () async {
        await Navigator.push(context, MaterialPageRoute(
          builder: (_) => ContractDetailScreen(
            contractId: c['id'],
            ownerUid: c['ownerUid'],
            isLandlord: isLandlord,
          ),
        ));
        _load();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 42, height: 42,
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.description_outlined, color: statusColor, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tenant['name'] ?? 'İsimsiz', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                      const SizedBox(height: 2),
                      Text(tenant['email'] ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)), overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                  child: Text(statusLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10)),
              child: Row(
                children: [
                  _InfoChip(icon: Icons.payments_outlined, text: '$rent TL/ay'),
                  const SizedBox(width: 16),
                  if (startDate != null) _InfoChip(icon: Icons.calendar_today_outlined, text: df.format(startDate)),
                  const Spacer(),
                  const Icon(Icons.chevron_right, size: 18, color: Color(0xFFCBD5E1)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _statusLabel(String status) {
    const labels = {
      'DRAFT': 'Taslak', 'DRAFT_READY': 'Hazır', 'EDEVLET_TRANSFERRED': 'e-Devlet',
      'EDEVLET_PENDING': 'Onay Bekliyor', 'EDEVLET_APPROVED': 'Onaylandı',
      'ACTIVE': 'Aktif', 'TERMINATED': 'Sonlandırıldı', 'CANCELLED': 'İptal',
    };
    return labels[status] ?? status;
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'ACTIVE': case 'EDEVLET_APPROVED': return const Color(0xFF16A34A);
      case 'DRAFT_READY': return const Color(0xFF3B82F6);
      case 'EDEVLET_TRANSFERRED': case 'EDEVLET_PENDING': return const Color(0xFFF59E0B);
      case 'TERMINATED': case 'CANCELLED': return const Color(0xFFEF4444);
      default: return const Color(0xFF94A3B8);
    }
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
      ],
    );
  }
}
