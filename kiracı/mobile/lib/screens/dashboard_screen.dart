import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class DashboardScreen extends StatefulWidget {
  final String activeRole;
  final void Function(int)? onSwitchTab;
  const DashboardScreen({super.key, this.activeRole = 'landlord', this.onSwitchTab});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  Map<String, dynamic>? _memberData;
  int _propertyCount = 0;
  int _contractCount = 0;
  int _pendingInvoices = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant DashboardScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeRole != widget.activeRole) _load();
  }

  Future<void> _load() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      final memberSnap = await FirebaseFirestore.instance.doc('accounts/${user.uid}/members/${user.uid}').get();
      if (memberSnap.exists) _memberData = memberSnap.data();

      int props = 0;
      int contracts = 0;
      int pending = 0;

      if (widget.activeRole == 'landlord') {
        // Landlord: own properties and contracts
        final propsSnap = await FirebaseFirestore.instance.collection('accounts/${user.uid}/properties').get();
        final contractsSnap = await FirebaseFirestore.instance.collection('accounts/${user.uid}/contracts').get();
        props = propsSnap.size;
        contracts = contractsSnap.size;
        for (final c in contractsSnap.docs) {
          final invSnap = await FirebaseFirestore.instance.collection('accounts/${user.uid}/contracts/${c.id}/invoices').get();
          pending += invSnap.docs.where((d) {
            final s = d.data()['status'];
            return s == 'DUE' || s == 'OVERDUE' || s == 'FAILED' || s == 'REFUNDED' || s == 'PAYMENT_PENDING';
          }).length;
        }
      } else {
        // Tenant: contracts where user is tenant
        if (user.email != null) {
          final tenantSnap = await FirebaseFirestore.instance
              .collectionGroup('contracts')
              .where('tenant.email', isEqualTo: user.email)
              .get();
          contracts = tenantSnap.size;
          for (final c in tenantSnap.docs) {
            final parts = c.reference.path.split('/');
            final ownerUid = parts.length >= 2 ? parts[1] : '';
            final invSnap = await FirebaseFirestore.instance
                .collection('accounts/$ownerUid/contracts/${c.id}/invoices')
                .get();
            pending += invSnap.docs.where((d) {
              final s = d.data()['status'];
              return s == 'DUE' || s == 'OVERDUE' || s == 'FAILED' || s == 'REFUNDED' || s == 'PAYMENT_PENDING';
            }).length;
          }
        }
      }

      if (mounted) {
        setState(() {
          _propertyCount = props;
          _contractCount = contracts;
          _pendingInvoices = pending;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Dashboard load error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final theme = Theme.of(context);

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final roles = _memberData?['roles'] as Map<String, dynamic>? ?? {};
    final displayName = _memberData?['displayName'] ?? user?.displayName ?? user?.email ?? '';

    return RefreshIndicator(
      onRefresh: () async {
        setState(() => _loading = true);
        await _load();
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Welcome card
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
                Text('Merhaba', style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.8))),
                const SizedBox(height: 4),
                Text(displayName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 6),
                Text('Tüm kira süreçleriniz tek panelde.', style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.75))),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [
                    if (roles['landlord'] == true) _RoleBadge(label: 'Ev Sahibi', color: Colors.white),
                    if (roles['tenant'] == true) _RoleBadge(label: 'Kiracı', color: Colors.white),
                    if (roles['agent'] == true) _RoleBadge(label: 'Emlakçı', color: Colors.white),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Stats
          Row(
            children: [
              if (widget.activeRole == 'landlord')
                _StatCard(value: '$_propertyCount', label: 'Taşınmaz', icon: Icons.home_outlined, color: theme.colorScheme.primary)
              else
                _StatCard(value: '$_contractCount', label: 'Sözleşme', icon: Icons.description_outlined, color: const Color(0xFF3B82F6)),
              const SizedBox(width: 10),
              if (widget.activeRole == 'landlord')
                _StatCard(value: '$_contractCount', label: 'Sözleşme', icon: Icons.description_outlined, color: const Color(0xFF3B82F6)),
              if (widget.activeRole == 'landlord')
                const SizedBox(width: 10),
              _StatCard(
                value: '$_pendingInvoices',
                label: widget.activeRole == 'landlord' ? 'Bekleyen' : 'Ödenmemiş',
                icon: Icons.payment_outlined,
                color: _pendingInvoices > 0 ? const Color(0xFFF59E0B) : theme.colorScheme.primary,
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Quick links
          Text('Hızlı Erişim', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurface)),
          const SizedBox(height: 12),
          if (widget.activeRole == 'landlord') ...[
            // Landlord: Taşınmaz(1), Sözleşme(2), Cüzdan(3), Talep(4)
            _QuickLink(
              icon: Icons.home_outlined,
              title: 'Taşınmazlarım',
              subtitle: 'Konut ve işyerlerini tek yerden yönet.',
              color: theme.colorScheme.primary,
              onTap: () => _switchTab(context, 1),
            ),
            const SizedBox(height: 10),
            _QuickLink(
              icon: Icons.description_outlined,
              title: 'Sözleşmeler',
              subtitle: 'Aktif kira sözleşmeleri ve durumları.',
              color: const Color(0xFF3B82F6),
              onTap: () => _switchTab(context, 2),
            ),
            const SizedBox(height: 10),
            _QuickLink(
              icon: Icons.account_balance_wallet_outlined,
              title: 'Cüzdanım',
              subtitle: 'Bakiyenizi ve aktarımları yönetin.',
              color: const Color(0xFFF59E0B),
              onTap: () => _switchTab(context, 3),
            ),
            const SizedBox(height: 10),
            _QuickLink(
              icon: Icons.inbox_outlined,
              title: 'Talepler',
              subtitle: 'Talep oluşturun veya mevcut talepleri yönetin.',
              color: const Color(0xFF8B5CF6),
              onTap: () => _switchTab(context, 4),
            ),
          ] else ...[
            // Tenant: Sözleşme(1), Ödeme(2), Talep(3)
            _QuickLink(
              icon: Icons.description_outlined,
              title: 'Sözleşmelerim',
              subtitle: 'Aktif kira sözleşmeleri ve durumları.',
              color: const Color(0xFF3B82F6),
              onTap: () => _switchTab(context, 1),
            ),
            const SizedBox(height: 10),
            _QuickLink(
              icon: Icons.payment_outlined,
              title: 'Ödemelerim',
              subtitle: 'Faturalarınızı görüntüleyin ve ödeyin.',
              color: const Color(0xFFF59E0B),
              onTap: () => _switchTab(context, 2),
            ),
            const SizedBox(height: 10),
            _QuickLink(
              icon: Icons.inbox_outlined,
              title: 'Talepler',
              subtitle: 'Talep oluşturun veya mevcut talepleri yönetin.',
              color: const Color(0xFF8B5CF6),
              onTap: () => _switchTab(context, 3),
            ),
          ],
        ],
      ),
    );
  }

  void _switchTab(BuildContext context, int index) {
    widget.onSwitchTab?.call(index);
  }
}

class _RoleBadge extends StatelessWidget {
  final String label;
  final Color color;
  const _RoleBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;
  const _StatCard({required this.value, required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          ],
        ),
      ),
    );
  }
}

class _QuickLink extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;
  const _QuickLink({required this.icon, required this.title, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Color(0xFFCBD5E1)),
            ],
          ),
        ),
      ),
    );
  }
}
