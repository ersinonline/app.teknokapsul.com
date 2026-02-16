import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dashboard_screen.dart';
import 'properties_screen.dart';
import 'contracts_screen.dart';
import 'invoices_screen.dart';
import 'requests_screen.dart';
import 'wallet_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  String _activeRole = 'landlord';
  Map<String, dynamic> _roles = {};

  // Landlord: Panel(0), Taşınmaz(1), Sözleşme(2), Cüzdan(3), Talep(4)
  // Tenant:   Panel(0), Sözleşme(1), Ödeme(2), Talep(3)
  int get _maxIndex => _activeRole == 'landlord' ? 4 : 3;

  void switchTab(int index) {
    if (index >= 0 && index <= _maxIndex) {
      setState(() => _currentIndex = index);
    }
  }

  @override
  void initState() {
    super.initState();
    _loadRoles();
  }

  Future<void> _loadRoles() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      final snap = await FirebaseFirestore.instance.doc('accounts/${user.uid}/members/${user.uid}').get();
      if (snap.exists && mounted) {
        final roles = snap.data()?['roles'] as Map<String, dynamic>? ?? {};
        setState(() {
          _roles = roles;
          if (roles['landlord'] == true) {
            _activeRole = 'landlord';
          } else if (roles['tenant'] == true) {
            _activeRole = 'tenant';
          }
        });
      }
    } catch (_) {}
  }

  void _toggleRole() {
    setState(() {
      _currentIndex = 0;
      _activeRole = _activeRole == 'landlord' ? 'tenant' : 'landlord';
    });
  }

  Future<void> _signOut() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Çıkış Yap'),
        content: const Text('Hesabınızdan çıkış yapmak istediğinize emin misiniz?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('İptal')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFEF4444)),
            child: const Text('Çıkış Yap'),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await FirebaseAuth.instance.signOut();
    }
  }

  Widget _screenForIndex(int index) {
    if (_activeRole == 'landlord') {
      // Landlord: Panel(0), Taşınmaz(1), Sözleşme(2), Cüzdan(3), Talep(4)
      switch (index) {
        case 0: return DashboardScreen(activeRole: _activeRole, onSwitchTab: switchTab);
        case 1: return const PropertiesScreen();
        case 2: return ContractsScreen(activeRole: _activeRole);
        case 3: return const WalletScreen();
        case 4: return RequestsScreen(activeRole: _activeRole);
        default: return DashboardScreen(activeRole: _activeRole, onSwitchTab: switchTab);
      }
    } else {
      // Tenant: Panel(0), Sözleşme(1), Ödeme(2), Talep(3)
      switch (index) {
        case 0: return DashboardScreen(activeRole: _activeRole, onSwitchTab: switchTab);
        case 1: return ContractsScreen(activeRole: _activeRole);
        case 2: return InvoicesScreen(activeRole: _activeRole);
        case 3: return RequestsScreen(activeRole: _activeRole);
        default: return DashboardScreen(activeRole: _activeRole, onSwitchTab: switchTab);
      }
    }
  }

  String _titleForIndex(int index) {
    if (_activeRole == 'landlord') {
      const t = ['Panel', 'Taşınmazlar', 'Sözleşmeler', 'Cüzdanım', 'Talepler'];
      return t[index.clamp(0, t.length - 1)];
    } else {
      const t = ['Panel', 'Sözleşmelerim', 'Ödemelerim', 'Talepler'];
      return t[index.clamp(0, t.length - 1)];
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 30, height: 30,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF14B8A6), Color(0xFF0D9488)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(child: Text('eK', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white))),
            ),
            const SizedBox(width: 10),
            Text(_titleForIndex(_currentIndex), style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: _activeRole == 'landlord' ? const Color(0xFFDCFCE7) : const Color(0xFFDBEAFE),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _activeRole == 'landlord' ? 'Ev Sahibi' : 'Kiracı',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: _activeRole == 'landlord' ? const Color(0xFF16A34A) : const Color(0xFF3B82F6)),
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            onPressed: _signOut,
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Çıkış Yap',
            style: IconButton.styleFrom(foregroundColor: const Color(0xFF94A3B8)),
          ),
          const SizedBox(width: 4),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
      ),
      body: _screenForIndex(_currentIndex),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
            child: Row(
              children: _activeRole == 'landlord'
                  ? [
                      // Landlord: Panel, Taşınmaz, Sözleşme, Cüzdan, Talep, [Swap]
                      _buildNavItem(Icons.dashboard_outlined, Icons.dashboard, 'Panel', 0),
                      _buildNavItem(Icons.home_outlined, Icons.home, 'Taşınmaz', 1),
                      _buildNavItem(Icons.description_outlined, Icons.description, 'Sözleşme', 2),
                      _buildNavItem(Icons.account_balance_wallet_outlined, Icons.account_balance_wallet, 'Cüzdan', 3),
                      _buildNavItem(Icons.inbox_outlined, Icons.inbox, 'Talep', 4),
                      _buildRoleSwitchItem(),
                    ]
                  : [
                      // Tenant: Panel, Sözleşme, Ödeme, Talep, [Swap]
                      _buildNavItem(Icons.dashboard_outlined, Icons.dashboard, 'Panel', 0),
                      _buildNavItem(Icons.description_outlined, Icons.description, 'Sözleşme', 1),
                      _buildNavItem(Icons.payment_outlined, Icons.payment, 'Ödeme', 2),
                      _buildNavItem(Icons.inbox_outlined, Icons.inbox, 'Talep', 3),
                      _buildRoleSwitchItem(),
                    ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, IconData activeIcon, String label, int index) {
    final isActive = _currentIndex == index;
    final theme = Theme.of(context);
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _currentIndex = index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(isActive ? activeIcon : icon, size: 21, color: isActive ? theme.colorScheme.primary : const Color(0xFF94A3B8)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 9, fontWeight: isActive ? FontWeight.w700 : FontWeight.w500, color: isActive ? theme.colorScheme.primary : const Color(0xFF94A3B8))),
            if (isActive)
              Container(margin: const EdgeInsets.only(top: 2), width: 4, height: 4, decoration: BoxDecoration(color: theme.colorScheme.primary, shape: BoxShape.circle))
            else
              const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleSwitchItem() {
    final isLandlord = _activeRole == 'landlord';
    final targetLabel = isLandlord ? 'Kiracı' : 'Ev Sahibi';
    final color = isLandlord ? const Color(0xFF3B82F6) : const Color(0xFF16A34A);
    return Expanded(
      child: GestureDetector(
        onTap: _toggleRole,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 22, height: 22,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(Icons.swap_horiz, size: 14, color: color),
            ),
            const SizedBox(height: 2),
            Text(targetLabel, style: TextStyle(fontSize: 8, fontWeight: FontWeight.w700, color: color)),
            const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }
}
