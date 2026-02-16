import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final theme = Theme.of(context);
    final initial = (user?.displayName ?? user?.email ?? '?')[0].toUpperCase();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SizedBox(height: 20),
        // Profile header card
        Card(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  backgroundImage:
                      user?.photoURL != null ? NetworkImage(user!.photoURL!) : null,
                  child: user?.photoURL == null
                      ? Text(initial, style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: theme.colorScheme.primary))
                      : null,
                ),
                const SizedBox(height: 16),
                Text(
                  user?.displayName ?? 'Kullanıcı',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Info card
        Card(
          child: Column(
            children: [
              ListTile(
                leading: Icon(Icons.email_outlined, color: theme.colorScheme.primary),
                title: const Text('İletişim', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('info@teknotech.info'),
              ),
              Divider(height: 1, color: theme.colorScheme.outline),
              ListTile(
                leading: Icon(Icons.shield_outlined, color: theme.colorScheme.primary),
                title: const Text('Hesap Türü', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(user?.providerData.isNotEmpty == true
                    ? user!.providerData.first.providerId == 'google.com'
                        ? 'Google Hesabı'
                        : 'E-posta Hesabı'
                    : 'Bilinmiyor'),
              ),
              Divider(height: 1, color: theme.colorScheme.outline),
              ListTile(
                leading: Icon(Icons.info_outline, color: theme.colorScheme.primary),
                title: const Text('Versiyon', style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('1.0.0'),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: OutlinedButton.icon(
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
            },
            icon: Icon(Icons.logout, color: theme.colorScheme.error),
            label: Text(
              'Çıkış Yap',
              style: TextStyle(color: theme.colorScheme.error, fontWeight: FontWeight.w600),
            ),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: theme.colorScheme.error.withValues(alpha: 0.3)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }
}
