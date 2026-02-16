import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

class CreateRequestScreen extends StatefulWidget {
  final String activeRole;
  const CreateRequestScreen({super.key, this.activeRole = 'landlord'});

  @override
  State<CreateRequestScreen> createState() => _CreateRequestScreenState();
}

class _CreateRequestScreenState extends State<CreateRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _loadingContracts = true;

  List<Map<String, dynamic>> _contracts = [];
  Map<String, dynamic>? _selectedContract;
  String? _requestType;

  final _messageCtrl = TextEditingController();
  final _increasePercentCtrl = TextEditingController();
  final _effectiveMonthCtrl = TextEditingController();
  final _discountPercentCtrl = TextEditingController();
  final _repairCostCtrl = TextEditingController();
  final List<XFile> _images = [];
  final _picker = ImagePicker();

  // Unpaid invoice data for UPFRONT_OFFER
  int _unpaidCount = 0;
  double _unpaidTotal = 0;

  static const _tenantTypes = [
    {'value': 'REPAIR_REQUEST', 'label': 'Arıza Bildirimi', 'icon': Icons.build_outlined, 'color': 0xFFF97316},
    {'value': 'UPFRONT_OFFER', 'label': 'Peşin Ödeme Teklifi', 'icon': Icons.payments_outlined, 'color': 0xFFF59E0B},
    {'value': 'CANCEL_REQUEST', 'label': 'Sözleşme İptali', 'icon': Icons.cancel_outlined, 'color': 0xFFEF4444},
  ];

  static const _landlordTypes = [
    {'value': 'RENT_INCREASE', 'label': 'Kira Artışı', 'icon': Icons.trending_up_outlined, 'color': 0xFF3B82F6},
    {'value': 'CANCEL_REQUEST', 'label': 'Sözleşme İptali', 'icon': Icons.cancel_outlined, 'color': 0xFFEF4444},
  ];

  List<Map<String, Object>> get _requestTypes =>
      widget.activeRole == 'tenant' ? _tenantTypes : _landlordTypes;

  int get _currentRent => (_selectedContract?['rentAmount'] as num?)?.toInt() ?? 0;

  double get _computedNewRent {
    final pct = double.tryParse(_increasePercentCtrl.text) ?? 0;
    return _currentRent * (1 + pct / 100);
  }

  double get _discountedTotal {
    final pct = double.tryParse(_discountPercentCtrl.text) ?? 0;
    return _unpaidTotal * (1 - pct / 100);
  }

  @override
  void initState() {
    super.initState();
    _loadContracts();
  }

  @override
  void dispose() {
    _messageCtrl.dispose();
    _increasePercentCtrl.dispose();
    _effectiveMonthCtrl.dispose();
    _discountPercentCtrl.dispose();
    _repairCostCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picked = await _picker.pickMultiImage(imageQuality: 70, maxWidth: 1200);
    if (picked.isNotEmpty && mounted) setState(() => _images.addAll(picked));
  }

  Future<void> _takePhoto() async {
    final picked = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70, maxWidth: 1200);
    if (picked != null && mounted) setState(() => _images.add(picked));
  }

  Future<void> _loadContracts() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      final contracts = <Map<String, dynamic>>[];

      final landlordSnap = await FirebaseFirestore.instance.collection('accounts/${user.uid}/contracts').get();
      for (final d in landlordSnap.docs) {
        final data = d.data();
        contracts.add({
          'id': d.id,
          'ownerUid': user.uid,
          'role': 'landlord',
          'landlordUid': user.uid,
          'tenantName': data['tenant']?['name'] ?? 'Kiracı',
          'tenantEmail': data['tenant']?['email'] ?? '',
          'rentAmount': data['rentAmount'],
          'contractDuration': data['contractDuration'],
          'status': data['status'],
        });
      }

      if (user.email != null) {
        final tenantSnap = await FirebaseFirestore.instance
            .collectionGroup('contracts')
            .where('tenant.email', isEqualTo: user.email)
            .get();
        for (final d in tenantSnap.docs) {
          final data = d.data();
          final parts = d.reference.path.split('/');
          final ownerUid = parts.length >= 2 ? parts[1] : '';
          if (ownerUid != user.uid) {
            contracts.add({
              'id': d.id,
              'ownerUid': ownerUid,
              'role': 'tenant',
              'landlordUid': ownerUid,
              'tenantName': data['tenant']?['name'] ?? '',
              'tenantEmail': data['tenant']?['email'] ?? '',
              'rentAmount': data['rentAmount'],
              'contractDuration': data['contractDuration'],
              'status': data['status'],
            });
          }
        }
      }

      if (mounted) {
        final active = contracts.where((c) {
          final s = c['status'];
          return s == 'ACTIVE' || s == 'EDEVLET_APPROVED' || s == 'DRAFT_READY';
        }).toList();
        setState(() {
          _contracts = active;
          _loadingContracts = false;
          if (active.length == 1) {
            _selectedContract = active.first;
            _loadUnpaidInvoices();
          }
        });
      }
    } catch (e) {
      debugPrint('Load contracts error: $e');
      if (mounted) setState(() => _loadingContracts = false);
    }
  }

  Future<void> _loadUnpaidInvoices() async {
    if (_selectedContract == null) return;
    final ownerUid = _selectedContract!['ownerUid'] as String;
    final contractId = _selectedContract!['id'] as String;
    try {
      final snap = await FirebaseFirestore.instance
          .collection('accounts/$ownerUid/contracts/$contractId/invoices')
          .get();
      int count = 0;
      double total = 0;
      for (final d in snap.docs) {
        final s = d.data()['status'] as String? ?? 'DUE';
        if (s == 'DUE' || s == 'OVERDUE' || s == 'FAILED' || s == 'REFUNDED') {
          count++;
          total += (d.data()['tenantTotal'] as num?)?.toDouble() ?? 0;
        }
      }
      if (mounted) setState(() { _unpaidCount = count; _unpaidTotal = total; });
    } catch (_) {}
  }

  void _onContractSelected(Map<String, dynamic> c) {
    setState(() {
      _selectedContract = c;
      _requestType = null;
    });
    _loadUnpaidInvoices();
  }

  Future<void> _submit() async {
    if (_selectedContract == null) {
      _showError('Lütfen bir sözleşme seçin.');
      return;
    }
    if (_requestType == null) {
      _showError('Lütfen talep türü seçin.');
      return;
    }

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    // Validations per type
    if (_requestType == 'RENT_INCREASE') {
      final pct = double.tryParse(_increasePercentCtrl.text) ?? 0;
      final month = int.tryParse(_effectiveMonthCtrl.text) ?? 0;
      if (pct <= 0) { _showError('Artış oranı girin.'); return; }
      if (month < 1) { _showError('Geçerli bir ay girin.'); return; }
    }
    if (_requestType == 'UPFRONT_OFFER') {
      final dp = double.tryParse(_discountPercentCtrl.text) ?? 0;
      if (dp < 0 || dp > 10) { _showError('İndirim oranı 0-10 arasında olmalı.'); return; }
      if (_unpaidCount == 0) { _showError('Ödenmemiş fatura yok.'); return; }
    }
    if (_requestType == 'CANCEL_REQUEST' && _messageCtrl.text.trim().isEmpty) {
      _showError('İptal sebebi yazın.'); return;
    }
    if (_requestType == 'REPAIR_REQUEST' && _messageCtrl.text.trim().isEmpty) {
      _showError('Arıza açıklaması yazın.'); return;
    }

    setState(() => _loading = true);
    try {
      final contract = _selectedContract!;
      final ownerUid = contract['ownerUid'] as String;
      final contractId = contract['id'] as String;
      final myRole = contract['role'] as String;
      final toRole = myRole == 'landlord' ? 'tenant' : 'landlord';

      // Upload images
      final imageUrls = <String>[];
      for (final img in _images) {
        final path = 'requests/$ownerUid/$contractId/${DateTime.now().millisecondsSinceEpoch}_${img.name}';
        final ref = FirebaseStorage.instance.ref(path);
        await ref.putFile(File(img.path));
        imageUrls.add(await ref.getDownloadURL());
      }

      final data = <String, dynamic>{
        'contractId': contractId,
        'ownerUid': ownerUid,
        'landlordUid': contract['landlordUid'] ?? ownerUid,
        'tenantEmail': contract['tenantEmail'] ?? '',
        'fromRole': myRole,
        'toRole': toRole,
        'type': _requestType,
        'message': _messageCtrl.text.trim(),
        'status': 'PENDING',
        'createdByUid': user.uid,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      };

      if (_requestType == 'RENT_INCREASE') {
        data['currentRent'] = _currentRent;
        data['increasePercent'] = double.tryParse(_increasePercentCtrl.text) ?? 0;
        data['newRent'] = _computedNewRent.round();
        data['effectiveMonth'] = int.tryParse(_effectiveMonthCtrl.text) ?? 0;
      }
      if (_requestType == 'UPFRONT_OFFER') {
        data['unpaidCount'] = _unpaidCount;
        data['unpaidTotal'] = _unpaidTotal;
        data['discountPercent'] = double.tryParse(_discountPercentCtrl.text) ?? 0;
        data['discountedTotal'] = _discountedTotal.round();
      }
      if (_requestType == 'REPAIR_REQUEST') {
        if (imageUrls.isNotEmpty) data['images'] = imageUrls;
        data['repairCost'] = int.tryParse(_repairCostCtrl.text) ?? 0;
        data['messages'] = [];
      }

      await FirebaseFirestore.instance
          .collection('accounts/$ownerUid/contracts/$contractId/requests')
          .add(data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Talep gönderildi!'), backgroundColor: Color(0xFF0F766E)),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      _showError('Hata: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: const Color(0xFFEF4444)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final nf = NumberFormat('#,###', 'tr_TR');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Yeni Talep'),
        centerTitle: true,
      ),
      body: _loadingContracts
          ? const Center(child: CircularProgressIndicator())
          : _contracts.isEmpty
              ? _buildEmpty()
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Step 1: Contract
                      _buildSectionHeader('1', 'Sözleşme Seçin', 'Talebin ilgili olduğu sözleşme'),
                      const SizedBox(height: 12),
                      ..._contracts.map((c) => _buildContractCard(c, theme)),

                      if (_selectedContract != null) ...[
                        const SizedBox(height: 24),
                        // Step 2: Type
                        _buildSectionHeader('2', 'Talep Türü', 'Ne hakkında talep oluşturmak istiyorsunuz?'),
                        const SizedBox(height: 12),
                        ..._requestTypes.map((t) => _buildTypeCard(t, theme)),

                        if (_requestType != null) ...[
                          const SizedBox(height: 24),
                          // Step 3: Details
                          _buildSectionHeader('3', 'Detaylar', 'Talep bilgilerini doldurun'),
                          const SizedBox(height: 12),
                          _buildTypeForm(theme, nf),

                          const SizedBox(height: 32),
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton(
                              onPressed: _loading ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              child: _loading
                                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.send_outlined, size: 18),
                                        SizedBox(width: 8),
                                        Text('Talep Gönder', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                                      ],
                                    ),
                            ),
                          ),
                          const SizedBox(height: 40),
                        ],
                      ],
                    ],
                  ),
                ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(color: const Color(0xFFF1F5F9), shape: BoxShape.circle),
              child: const Icon(Icons.description_outlined, size: 40, color: Color(0xFF94A3B8)),
            ),
            const SizedBox(height: 20),
            const Text('Aktif sözleşme yok', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF334155))),
            const SizedBox(height: 8),
            const Text('Talep oluşturmak için aktif bir sözleşmeniz olmalı.', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8))),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String num, String title, String subtitle) {
    return Row(
      children: [
        Container(
          width: 28, height: 28,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF14B8A6), Color(0xFF0D9488)]),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(child: Text(num, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white))),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
              Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildContractCard(Map<String, dynamic> c, ThemeData theme) {
    final isSelected = _selectedContract?['id'] == c['id'] && _selectedContract?['ownerUid'] == c['ownerUid'];
    final role = c['role'] as String;
    return GestureDetector(
      onTap: () => _onContractSelected(c),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primary.withValues(alpha: 0.06) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isSelected ? theme.colorScheme.primary : const Color(0xFFE2E8F0), width: isSelected ? 2 : 1),
        ),
        child: Row(
          children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(
                color: role == 'landlord' ? const Color(0xFFDCFCE7) : const Color(0xFFDBEAFE),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                role == 'landlord' ? Icons.home_outlined : Icons.person_outline,
                color: role == 'landlord' ? const Color(0xFF22C55E) : const Color(0xFF3B82F6), size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(c['tenantName'] ?? 'Sözleşme', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: isSelected ? theme.colorScheme.primary : const Color(0xFF0F172A))),
                  const SizedBox(height: 2),
                  Text('${role == 'landlord' ? 'Ev Sahibi' : 'Kiracı'} • ${c['rentAmount'] ?? '—'} TL/ay', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                ],
              ),
            ),
            if (isSelected) Icon(Icons.check_circle, color: theme.colorScheme.primary, size: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeCard(Map<String, Object> t, ThemeData theme) {
    final isSelected = _requestType == t['value'];
    final color = Color(t['color'] as int);
    return GestureDetector(
      onTap: () => setState(() => _requestType = t['value'] as String),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.08) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isSelected ? color : const Color(0xFFE2E8F0), width: isSelected ? 2 : 1),
        ),
        child: Row(
          children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
              child: Icon(t['icon'] as IconData, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(t['label'] as String, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: isSelected ? color : const Color(0xFF334155)))),
            if (isSelected) Icon(Icons.check_circle, color: color, size: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeForm(ThemeData theme, NumberFormat nf) {
    switch (_requestType) {
      case 'RENT_INCREASE': return _buildRentIncreaseForm(theme, nf);
      case 'UPFRONT_OFFER': return _buildUpfrontOfferForm(theme, nf);
      case 'REPAIR_REQUEST': return _buildRepairForm(theme);
      case 'CANCEL_REQUEST': return _buildCancelForm(theme);
      default: return const SizedBox.shrink();
    }
  }

  Widget _buildRentIncreaseForm(ThemeData theme, NumberFormat nf) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Kira Artışı Detayları', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E40AF))),
          const SizedBox(height: 16),
          _buildReadOnlyField('Güncel Kira', '${nf.format(_currentRent)} ₺'),
          const SizedBox(height: 12),
          TextFormField(
            controller: _increasePercentCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Artış Oranı (%)', hintText: 'Ör: 25', prefixIcon: Icon(Icons.percent, size: 18)),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          _buildReadOnlyField('Yeni Kira', '${nf.format(_computedNewRent.round())} ₺', color: const Color(0xFF059669)),
          const SizedBox(height: 12),
          TextFormField(
            controller: _effectiveMonthCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Kaçıncı aydan itibaren?', hintText: 'Ör: 7', prefixIcon: Icon(Icons.calendar_today, size: 18)),
          ),
          const SizedBox(height: 4),
          const Text('Sözleşme 12 ay olarak yenilenir.', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
          const SizedBox(height: 12),
          TextFormField(
            controller: _messageCtrl,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Açıklama (opsiyonel)', hintText: 'Artış sebebi...'),
          ),
        ],
      ),
    );
  }

  Widget _buildUpfrontOfferForm(ThemeData theme, NumberFormat nf) {
    if (_unpaidCount == 0) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: const Color(0xFFFFFBEB), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFFDE68A))),
        child: const Text('Ödenmemiş fatura bulunmuyor.', style: TextStyle(fontSize: 14, color: Color(0xFF92400E))),
      );
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Peşin Ödeme Teklifi', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF92400E))),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildReadOnlyField('Ödenmemiş', '$_unpaidCount adet')),
              const SizedBox(width: 12),
              Expanded(child: _buildReadOnlyField('Toplam Borç', '${nf.format(_unpaidTotal.round())} ₺')),
            ],
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _discountPercentCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'İndirim Oranı (% maks. 10)', hintText: 'Ör: 8', prefixIcon: Icon(Icons.discount_outlined, size: 18)),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFFDE68A))),
            child: Row(
              children: [
                const Text('İndirimli Toplam: ', style: TextStyle(fontSize: 12, color: Color(0xFF92400E))),
                Text('${nf.format(_discountedTotal.round())} ₺', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF92400E))),
                if ((double.tryParse(_discountPercentCtrl.text) ?? 0) > 0)
                  Text('  (%${_discountPercentCtrl.text} indirim)', style: const TextStyle(fontSize: 11, color: Color(0xFF059669))),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Text('Ev sahibi onaylarsa 1 hafta içinde ödeme yapmanız gerekir.', style: TextStyle(fontSize: 11, color: Color(0xFFB45309))),
          const SizedBox(height: 12),
          TextFormField(
            controller: _messageCtrl,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Açıklama (opsiyonel)', hintText: 'Ek bilgi...'),
          ),
        ],
      ),
    );
  }

  Widget _buildRepairForm(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFED7AA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Arıza Bildirimi', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF9A3412))),
          const SizedBox(height: 16),
          TextFormField(
            controller: _messageCtrl,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Arıza Açıklaması *', hintText: 'Arızayı detaylı açıklayın...'),
          ),
          const SizedBox(height: 16),
          const Text('Fotoğraflar', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF9A3412))),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildImageButton(Icons.photo_library_outlined, 'Galeri', _pickImages),
              const SizedBox(width: 8),
              _buildImageButton(Icons.camera_alt_outlined, 'Kamera', _takePhoto),
            ],
          ),
          if (_images.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              height: 80,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _images.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) => Stack(
                  clipBehavior: Clip.none,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.file(File(_images[i].path), width: 80, height: 80, fit: BoxFit.cover),
                    ),
                    Positioned(
                      top: -6, right: -6,
                      child: GestureDetector(
                        onTap: () => setState(() => _images.removeAt(i)),
                        child: Container(
                          width: 22, height: 22,
                          decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                          child: const Icon(Icons.close, size: 14, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          TextFormField(
            controller: _repairCostCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Tahmini Arıza Ücreti (₺)', hintText: '0', prefixIcon: Icon(Icons.payments_outlined, size: 18)),
          ),
          const SizedBox(height: 4),
          const Text('Ev sahibi tutarı değiştirebilir. Onaylanırsa ilk kiradan düşülür.', style: TextStyle(fontSize: 11, color: Color(0xFFB45309))),
        ],
      ),
    );
  }

  Widget _buildCancelForm(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Sözleşme İptali', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF991B1B))),
          const SizedBox(height: 8),
          const Text('Karşı taraf onaylarsa sözleşme iptal edilecektir.', style: TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
          const SizedBox(height: 16),
          TextFormField(
            controller: _messageCtrl,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'İptal Sebebi / Açıklama *', hintText: 'İptal sebebinizi detaylı yazın...'),
          ),
        ],
      ),
    );
  }

  Widget _buildReadOnlyField(String label, String value, {Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8))),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
          child: Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color ?? const Color(0xFF334155))),
        ),
      ],
    );
  }

  Widget _buildImageButton(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 18),
        label: Text(label, style: const TextStyle(fontSize: 13)),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
