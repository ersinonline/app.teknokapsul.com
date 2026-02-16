import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  bool _loading = false;
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLandlord = true;
  bool _isTenant = false;
  bool _isAgent = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_isLandlord && !_isTenant && !_isAgent) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('En az bir rol seçmelisiniz.'), backgroundColor: Color(0xFFEF4444)),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final name = _nameController.text.trim();
      final email = _emailController.text.trim();
      final password = _passwordController.text;

      final cred = await FirebaseAuth.instance.createUserWithEmailAndPassword(email: email, password: password);
      final user = cred.user!;
      await user.updateDisplayName(name);

      final uid = user.uid;
      final agentId = _isAgent ? 'AG-${uid.substring(0, 8).toUpperCase()}' : null;

      await FirebaseFirestore.instance.doc('accounts/$uid').set({
        'type': 'individual',
        'ownerUid': uid,
        'createdAt': FieldValue.serverTimestamp(),
      });

      await FirebaseFirestore.instance.doc('accounts/$uid/members/$uid').set({
        'uid': uid,
        'displayName': name,
        'email': email,
        'agentId': agentId,
        'roles': {
          'landlord': _isLandlord,
          'tenant': _isTenant,
          'agent': _isAgent,
        },
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Hesabınız oluşturuldu!'), backgroundColor: Color(0xFF0F766E)),
        );
        Navigator.pop(context);
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        String msg;
        switch (e.code) {
          case 'email-already-in-use': msg = 'Bu e-posta adresi zaten kullanımda.'; break;
          case 'weak-password': msg = 'Şifre en az 6 karakter olmalıdır.'; break;
          case 'invalid-email': msg = 'Geçersiz e-posta adresi.'; break;
          default: msg = e.message ?? 'Kayıt başarısız.';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: const Color(0xFFEF4444)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hata: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Kayıt Ol'),
        backgroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Yeni hesap oluşturun', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('Rollerinizi seçin, sözleşme yönetimine başlayın.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                const SizedBox(height: 28),

                TextFormField(
                  controller: _nameController,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'Ad Soyad',
                    hintText: 'Adınız Soyadınız',
                    prefixIcon: Icon(Icons.person_outline, color: theme.colorScheme.onSurfaceVariant),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Ad soyad gerekli' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'E-posta',
                    hintText: 'ornek@mail.com',
                    prefixIcon: Icon(Icons.email_outlined, color: theme.colorScheme.onSurfaceVariant),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'E-posta gerekli';
                    if (!v.contains('@')) return 'Geçerli bir e-posta girin';
                    return null;
                  },
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  decoration: InputDecoration(
                    labelText: 'Şifre',
                    hintText: 'En az 6 karakter',
                    prefixIcon: Icon(Icons.lock_outline, color: theme.colorScheme.onSurfaceVariant),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Şifre gerekli';
                    if (v.length < 6) return 'En az 6 karakter';
                    return null;
                  },
                ),

                const SizedBox(height: 24),
                Text('Rolleriniz', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface)),
                const SizedBox(height: 4),
                Text('Birden fazla rol seçebilirsiniz.', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
                const SizedBox(height: 12),

                _RoleChip(label: 'Ev Sahibi', icon: Icons.home_outlined, selected: _isLandlord, onTap: () => setState(() => _isLandlord = !_isLandlord)),
                const SizedBox(height: 8),
                _RoleChip(label: 'Kiracı', icon: Icons.person_outline, selected: _isTenant, onTap: () => setState(() => _isTenant = !_isTenant)),
                const SizedBox(height: 8),
                _RoleChip(label: 'Emlakçı', icon: Icons.business_outlined, selected: _isAgent, onTap: () => setState(() => _isAgent = !_isAgent)),

                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _register,
                    child: _loading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Kayıt Ol'),
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Zaten hesabınız var mı? Giriş Yap'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _RoleChip({required this.label, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? theme.colorScheme.primaryContainer : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? theme.colorScheme.primary : const Color(0xFFE2E8F0),
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 22, color: selected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? theme.colorScheme.primary : theme.colorScheme.onSurface))),
            if (selected) Icon(Icons.check_circle, color: theme.colorScheme.primary, size: 22),
          ],
        ),
      ),
    );
  }
}
