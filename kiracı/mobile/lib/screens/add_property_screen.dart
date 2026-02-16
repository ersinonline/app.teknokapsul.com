import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AddPropertyScreen extends StatefulWidget {
  const AddPropertyScreen({super.key});

  @override
  State<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends State<AddPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  String _type = 'residential';
  final _cityController = TextEditingController();
  final _districtController = TextEditingController();
  final _addressController = TextEditingController();
  final _roomCountController = TextEditingController();
  final _floorController = TextEditingController();

  @override
  void dispose() {
    _cityController.dispose();
    _districtController.dispose();
    _addressController.dispose();
    _roomCountController.dispose();
    _floorController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _loading = true);
    try {
      await FirebaseFirestore.instance.collection('accounts/${user.uid}/properties').add({
        'ownerUid': user.uid,
        'createdByUid': user.uid,
        'type': _type,
        'address': {
          'city': _cityController.text.trim(),
          'district': _districtController.text.trim(),
          'fullText': _addressController.text.trim(),
        },
        'meta': {
          'roomCount': _roomCountController.text.trim(),
          'floor': _floorController.text.trim(),
        },
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Taşınmaz başarıyla eklendi!'), backgroundColor: Color(0xFF0F766E)),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e'), backgroundColor: const Color(0xFFEF4444)),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Yeni Taşınmaz Ekle')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mülk Tipi', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface)),
              const SizedBox(height: 4),
              Text('Bu mülkü ne amaçla kiralayacaksınız?', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _TypeOption(
                      label: 'Konut / Daire',
                      icon: Icons.home_outlined,
                      selected: _type == 'residential',
                      onTap: () => setState(() => _type = 'residential'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _TypeOption(
                      label: 'İşyeri / Ofis',
                      icon: Icons.business_outlined,
                      selected: _type == 'commercial',
                      onTap: () => setState(() => _type = 'commercial'),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),
              Text('Adres Bilgileri', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _cityController,
                      decoration: const InputDecoration(labelText: 'Şehir'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Gerekli' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _districtController,
                      decoration: const InputDecoration(labelText: 'İlçe'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Gerekli' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _addressController,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Açık Adres', hintText: 'Mahalle, sokak, bina no, daire no...'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Adres gerekli' : null,
              ),

              const SizedBox(height: 24),
              Text('Detaylar', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _roomCountController,
                      decoration: const InputDecoration(labelText: 'Oda Sayısı', hintText: '3+1'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _floorController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Kat', hintText: '5'),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Taşınmaz Ekle'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TypeOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _TypeOption({required this.label, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? theme.colorScheme.primaryContainer : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? theme.colorScheme.primary : const Color(0xFFE2E8F0),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, size: 28, color: selected ? theme.colorScheme.primary : const Color(0xFF64748B)),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: selected ? theme.colorScheme.primary : const Color(0xFF64748B))),
          ],
        ),
      ),
    );
  }
}
