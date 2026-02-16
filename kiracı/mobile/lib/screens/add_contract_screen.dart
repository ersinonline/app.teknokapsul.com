import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AddContractScreen extends StatefulWidget {
  const AddContractScreen({super.key});

  @override
  State<AddContractScreen> createState() => _AddContractScreenState();
}

const _defaultClauses = [
  'Kiracı; ısıtma, aydınlatma, su vb. tüm kullanım giderlerini öder.',
  'Kiralananı teslim aldığı durumda geri verir; olağan kullanımdan doğan eskimelerden sorumlu değildir.',
  'Kiralananı sözleşmeye uygun ve özenli kullanmak zorundadır.',
  'Komşulara ve apartman sakinlerine saygılı davranmakla yükümlüdür.',
  'Kullanım amacını (konut) değiştiremez.',
  'Kiraya veren, teslimde ayıp/eksikleri yazılı bildirmezse kiracı sorumluluktan kurtulur (gizli ayıplar hariç).',
  'Yazılı izin olmadan başkasına kiralayamaz veya devredemez.',
  'Üçüncü kişilerin hak iddialarında kiraya veren davayı üstlenir ve zararı giderir.',
  'Düzenlenmeyen hususlarda TBK, KMK ve ilgili mevzuat uygulanır.',
  'Ortak alan/tesislerin onarımı için gerekli hallerde kiracı izin vermek zorundadır.',
  'Yönetim ve ortak gider bildirimlerini kiraya verene iletir.',
  'Kat malikleri kurulu kararları uyarınca yapılacak işlere izin verir.',
  'Zorunlu onarım/incelemeler için bağımsız bölüme girişe izin verir.',
  'Yazılı izin olmadan değişiklik yapamaz; zararı karşılar.',
  'Olağan temizlik ve bakım giderlerini öder.',
  'Kendisinin gidermekle yükümlü olmadığı ayıpları derhal bildirir.',
  'Ayıp giderme ve zarar önleme çalışmalarına katlanır (önceden bildirim şartıyla).',
  'Satış/bakım/yeniden kiralama için gezmeye izin verir (önceden bildirim).',
  'Tahliyede profesyonel temizlik ve gerekirse boya bedeli kiracıya aittir.',
  'Tüm abonelikler kiracı adına açılır/kapatılır; borçlardan kiracı sorumludur.',
  'Airbnb/günlük/oda kiralama yasaktır; ihlalde derhal fesih ve 3 aylık kira cezai şartı vardır.',
  'Depozito, kontroller sonrası en geç 30 gün içinde iade edilir; hasar varsa kesinti yapılır.',
  'Süre dolmadan tahliyede, yeniden kiralanana kadar en fazla 2 aylık kira zararını öder.',
  'Kefalet müteselsildir; kefil tüm borçlardan kiracıyla birlikte sorumludur.',
  'Kira vadesinde ödenmez ve gecikme 15 günü aşarsa kiraya veren feshedebilir.',
  'Gürültü/huzursuzlukta derhal ve haklı nedenle fesih mümkündür.',
  'Kasıt/ağır ihmal zararları 7 gün içinde giderilir; aksi halde bedeli talep edilir ve fesih olabilir.',
  'Teslimde tüm demirbaşların çalışır olduğu kabul edilir; tespit edilen giderler derhal ödenir veya depodan mahsup edilir.',
  'Yazılı izin olmadan sürekli ikamet edecek başka kişi yerleştirilemez.',
  'Tahliyede anahtar imza karşılığı teslim edilmedikçe tahliye geçerli sayılmaz.',
  'Aidat ve tüm ortak giderler kiracıya aittir; aidat borcu sözleşme ihlalidir.',
  'Tahliye öncesi tüm fatura/aidatlar kapatılır; çıkarsa ödenen tutarlar + %10 işletme gideri ile kiracıya rücu edilir.',
];

class _AddContractScreenState extends State<AddContractScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  int _step = 0;

  // Tenant info
  final _tenantNameCtrl = TextEditingController();
  final _tenantTcknCtrl = TextEditingController();
  final _tenantEmailCtrl = TextEditingController();
  final _tenantPhoneCtrl = TextEditingController();

  // Property
  List<Map<String, dynamic>> _properties = [];
  String? _selectedPropertyId;

  // Terms
  final _rentAmountCtrl = TextEditingController();
  final _payDayCtrl = TextEditingController(text: '1');
  final _ibanCtrl = TextEditingController();
  final _receiverNameCtrl = TextEditingController();
  bool _lateFeeEnabled = true;
  DateTime? _startDate;

  // Fixtures
  final List<Map<String, String>> _fixtures = [];
  final _fixtureNameCtrl = TextEditingController();
  String _fixtureCondition = 'iyi';

  // Clauses
  final Set<int> _selectedClauses = {};
  final List<String> _customClauses = [];
  final _customClauseCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  @override
  void dispose() {
    _tenantNameCtrl.dispose();
    _tenantTcknCtrl.dispose();
    _tenantEmailCtrl.dispose();
    _tenantPhoneCtrl.dispose();
    _rentAmountCtrl.dispose();
    _payDayCtrl.dispose();
    _ibanCtrl.dispose();
    _receiverNameCtrl.dispose();
    _fixtureNameCtrl.dispose();
    _customClauseCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProperties() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final snap = await FirebaseFirestore.instance.collection('accounts/${user.uid}/properties').get();
    if (mounted) {
      setState(() {
        _properties = snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
      });
    }
  }

  Future<void> _submit() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    setState(() => _loading = true);

    try {
      await FirebaseFirestore.instance.collection('accounts/${user.uid}/contracts').add({
        'ownerUid': user.uid,
        'landlordUid': user.uid,
        'createdByUid': user.uid,
        'propertyId': _selectedPropertyId,
        'tenant': {
          'name': _tenantNameCtrl.text.trim(),
          'tckn': _tenantTcknCtrl.text.trim(),
          'email': _tenantEmailCtrl.text.trim(),
          'phone': _tenantPhoneCtrl.text.trim(),
        },
        'rentAmount': int.tryParse(_rentAmountCtrl.text.trim()) ?? 0,
        'depositAmount': (int.tryParse(_rentAmountCtrl.text.trim()) ?? 0) * 3,
        'payDay': int.tryParse(_payDayCtrl.text.trim()) ?? 1,
        'lateFeeEnabled': _lateFeeEnabled,
        'startDate': _startDate != null ? Timestamp.fromDate(_startDate!) : null,
        'iban': {'iban': _ibanCtrl.text.trim(), 'receiverName': _receiverNameCtrl.text.trim()},
        'fixtures': _fixtures,
        'clauses': [
          ..._selectedClauses.toList()..sort(),
        ].map((i) => _defaultClauses[i]).toList()
          ..addAll(_customClauses),
        'status': 'DRAFT_READY',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sözleşme oluşturuldu!'), backgroundColor: Color(0xFF0F766E)),
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
    final steps = ['Kiracı', 'Taşınmaz', 'Şartlar', 'Demirbaş', 'Onay'];

    return Scaffold(
      appBar: AppBar(title: const Text('Yeni Sözleşme')),
      body: Column(
        children: [
          // Stepper indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            color: Colors.white,
            child: Row(
              children: List.generate(steps.length, (i) {
                final isActive = i == _step;
                final isDone = i < _step;
                return Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: isDone ? theme.colorScheme.primary : isActive ? theme.colorScheme.primary : const Color(0xFFE2E8F0),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: isDone
                              ? const Icon(Icons.check, size: 16, color: Colors.white)
                              : Text('${i + 1}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isActive ? Colors.white : const Color(0xFF64748B))),
                        ),
                      ),
                      if (i < steps.length - 1)
                        Expanded(child: Container(height: 2, color: isDone ? theme.colorScheme.primary : const Color(0xFFE2E8F0))),
                    ],
                  ),
                );
              }),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(steps[_step], style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurface)),
            ),
          ),
          const SizedBox(height: 8),

          // Step content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: _buildStep(),
              ),
            ),
          ),

          // Bottom buttons
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Row(
              children: [
                if (_step > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _step--),
                      child: const Text('Geri'),
                    ),
                  ),
                if (_step > 0) const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _onNext,
                    child: _loading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(_step == 4 ? 'Sözleşme Oluştur' : 'Devam'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _onNext() {
    if (_step < 4) {
      if (_step == 0 && !_formKey.currentState!.validate()) return;
      if (_step == 1 && _selectedPropertyId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lütfen bir taşınmaz seçin.'), backgroundColor: Color(0xFFEF4444)),
        );
        return;
      }
      if (_step == 2 && !_formKey.currentState!.validate()) return;
      setState(() => _step++);
    } else {
      _submit();
    }
  }

  Widget _buildStep() {
    switch (_step) {
      case 0: return _buildTenantStep();
      case 1: return _buildPropertyStep();
      case 2: return _buildTermsStep();
      case 3: return _buildFixturesClausesStep();
      case 4: return _buildConfirmStep();
      default: return const SizedBox();
    }
  }

  Widget _buildTenantStep() {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Kiracının bilgilerini girin.', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 16),
        TextFormField(
          controller: _tenantNameCtrl,
          decoration: const InputDecoration(labelText: 'Ad Soyad', prefixIcon: Icon(Icons.person_outline)),
          validator: (v) => (v == null || v.trim().isEmpty) ? 'Gerekli' : null,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _tenantTcknCtrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'TCKN', prefixIcon: Icon(Icons.badge_outlined)),
          validator: (v) => (v == null || v.trim().length != 11) ? '11 haneli TCKN girin' : null,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _tenantEmailCtrl,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'E-posta', prefixIcon: Icon(Icons.email_outlined)),
          validator: (v) => (v == null || !v.contains('@')) ? 'Geçerli e-posta girin' : null,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _tenantPhoneCtrl,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(labelText: 'Telefon', prefixIcon: Icon(Icons.phone_outlined)),
        ),
      ],
    );
  }

  Widget _buildPropertyStep() {
    final theme = Theme.of(context);
    if (_properties.isEmpty) {
      return Center(
        child: Column(
          children: [
            const SizedBox(height: 32),
            Icon(Icons.home_outlined, size: 48, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            const Text('Henüz taşınmaz eklenmemiş.', style: TextStyle(color: Color(0xFF64748B))),
            const SizedBox(height: 8),
            const Text('Önce bir taşınmaz ekleyin.', style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Kiralayacağınız taşınmazı seçin.', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 16),
        ..._properties.map((p) {
          final address = p['address'] as Map<String, dynamic>? ?? {};
          final isSelected = _selectedPropertyId == p['id'];
          return GestureDetector(
            onTap: () => setState(() => _selectedPropertyId = p['id']),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isSelected ? theme.colorScheme.primaryContainer : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? theme.colorScheme.primary : const Color(0xFFE2E8F0),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.home_outlined, color: isSelected ? theme.colorScheme.primary : const Color(0xFF64748B)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(address['fullText'] ?? 'Adres yok', style: TextStyle(fontWeight: FontWeight.w600, color: isSelected ? theme.colorScheme.primary : null)),
                        Text('${address['city'] ?? ''} / ${address['district'] ?? ''}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                  if (isSelected) Icon(Icons.check_circle, color: theme.colorScheme.primary),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildTermsStep() {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Kira şartlarını belirleyin.', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 16),
        TextFormField(
          controller: _rentAmountCtrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Aylık Kira (TL)', prefixIcon: Icon(Icons.payments_outlined)),
          validator: (v) => (v == null || v.trim().isEmpty) ? 'Gerekli' : null,
        ),
        const SizedBox(height: 12),
        // Depozito otomatik 3x kira
        InputDecorator(
          decoration: const InputDecoration(labelText: 'Depozito (3 kira tutarı)', prefixIcon: Icon(Icons.account_balance_wallet_outlined)),
          child: Text(
            _rentAmountCtrl.text.isNotEmpty ? '${(int.tryParse(_rentAmountCtrl.text.trim()) ?? 0) * 3} TL' : '—',
            style: TextStyle(color: _rentAmountCtrl.text.isNotEmpty ? null : const Color(0xFF94A3B8)),
          ),
        ),
        if (_rentAmountCtrl.text.isNotEmpty && (int.tryParse(_rentAmountCtrl.text.trim()) ?? 0) > 0)
          Padding(
            padding: const EdgeInsets.only(top: 4, left: 4),
            child: Text(
              '2 kira (${(int.tryParse(_rentAmountCtrl.text.trim()) ?? 0) * 2} TL) ev sahibine, 1 kira (${int.tryParse(_rentAmountCtrl.text.trim()) ?? 0} TL) platform',
              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
            ),
          ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _payDayCtrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Ödeme Günü (1-28)', prefixIcon: Icon(Icons.calendar_today_outlined)),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime.now(),
              firstDate: DateTime(2020),
              lastDate: DateTime(2030),
            );
            if (picked != null) setState(() => _startDate = picked);
          },
          child: InputDecorator(
            decoration: const InputDecoration(labelText: 'Başlangıç Tarihi', prefixIcon: Icon(Icons.event_outlined)),
            child: Text(
              _startDate != null ? '${_startDate!.day}.${_startDate!.month}.${_startDate!.year}' : 'Tarih seçin',
              style: TextStyle(color: _startDate != null ? null : const Color(0xFF94A3B8)),
            ),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _ibanCtrl,
          decoration: const InputDecoration(labelText: 'IBAN', prefixIcon: Icon(Icons.credit_card_outlined)),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _receiverNameCtrl,
          decoration: const InputDecoration(labelText: 'Alıcı Adı', prefixIcon: Icon(Icons.person_outline)),
        ),
        const SizedBox(height: 16),
        SwitchListTile(
          title: const Text('Gecikme Faizi', style: TextStyle(fontWeight: FontWeight.w600)),
          subtitle: const Text('5 gün muaf, sonra günlük %1', style: TextStyle(fontSize: 12)),
          value: _lateFeeEnabled,
          activeTrackColor: theme.colorScheme.primary,
          onChanged: (v) => setState(() => _lateFeeEnabled = v),
          contentPadding: EdgeInsets.zero,
        ),
      ],
    );
  }

  Widget _buildFixturesClausesStep() {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Demirbaş
        Text('Demirbaş Listesi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurface)),
        const SizedBox(height: 4),
        Text('Mülkteki demirbaşları ekleyin (opsiyonel).', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              flex: 3,
              child: TextField(
                controller: _fixtureNameCtrl,
                decoration: const InputDecoration(hintText: 'Demirbaş adı', isDense: true),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: DropdownButtonFormField<String>(
                value: _fixtureCondition,
                decoration: const InputDecoration(isDense: true),
                items: const [
                  DropdownMenuItem(value: 'yeni', child: Text('Yeni')),
                  DropdownMenuItem(value: 'iyi', child: Text('İyi')),
                  DropdownMenuItem(value: 'orta', child: Text('Orta')),
                  DropdownMenuItem(value: 'eski', child: Text('Eski')),
                ],
                onChanged: (v) => setState(() => _fixtureCondition = v ?? 'iyi'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () {
                if (_fixtureNameCtrl.text.trim().isEmpty) return;
                setState(() {
                  _fixtures.add({'name': _fixtureNameCtrl.text.trim(), 'condition': _fixtureCondition});
                  _fixtureNameCtrl.clear();
                });
              },
              icon: const Icon(Icons.add_circle, color: Color(0xFF0F766E)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_fixtures.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Text('Henüz demirbaş eklenmedi.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontStyle: FontStyle.italic)),
          )
        else
          ..._fixtures.asMap().entries.map((e) {
            final i = e.key;
            final f = e.value;
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
                  Expanded(child: Text(f['name']!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(4)),
                    child: Text(f['condition']!, style: const TextStyle(fontSize: 10)),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => setState(() => _fixtures.removeAt(i)),
                    child: const Icon(Icons.close, size: 16, color: Colors.red),
                  ),
                ],
              ),
            );
          }),

        const SizedBox(height: 24),
        const Divider(),
        const SizedBox(height: 16),

        // Sözleşme Maddeleri
        Text('Sözleşme Maddeleri', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurface)),
        const SizedBox(height: 4),
        Text('Hazır maddelerden seçin veya kendi maddenizi ekleyin.', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 8),
        Row(
          children: [
            TextButton(
              onPressed: () => setState(() { for (int i = 0; i < _defaultClauses.length; i++) _selectedClauses.add(i); }),
              child: const Text('Tümünü Seç', style: TextStyle(fontSize: 12)),
            ),
            const Text('|', style: TextStyle(color: Color(0xFFCBD5E1))),
            TextButton(
              onPressed: () => setState(() => _selectedClauses.clear()),
              child: const Text('Tümünü Kaldır', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            ),
            const Spacer(),
            Text('${_selectedClauses.length} seçili', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
          ],
        ),
        Container(
          constraints: const BoxConstraints(maxHeight: 250),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade200),
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _defaultClauses.length,
            itemBuilder: (_, i) {
              return CheckboxListTile(
                dense: true,
                controlAffinity: ListTileControlAffinity.leading,
                value: _selectedClauses.contains(i),
                onChanged: (v) => setState(() { if (v == true) _selectedClauses.add(i); else _selectedClauses.remove(i); }),
                title: Text('${i + 1}. ${_defaultClauses[i]}', style: const TextStyle(fontSize: 11)),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        Text('Özel Maddeler', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface)),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _customClauseCtrl,
                decoration: const InputDecoration(hintText: 'Kendi maddenizi yazın...', isDense: true),
                style: const TextStyle(fontSize: 13),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () {
                if (_customClauseCtrl.text.trim().isEmpty) return;
                setState(() {
                  _customClauses.add(_customClauseCtrl.text.trim());
                  _customClauseCtrl.clear();
                });
              },
              icon: const Icon(Icons.add_circle, color: Color(0xFF0F766E)),
            ),
          ],
        ),
        if (_customClauses.isNotEmpty) ...
          _customClauses.asMap().entries.map((e) {
            final i = e.key;
            return Container(
              margin: const EdgeInsets.only(top: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDFA),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF99F6E4)),
              ),
              child: Row(
                children: [
                  Expanded(child: Text('${_selectedClauses.length + i + 1}. ${e.value}', style: const TextStyle(fontSize: 12, color: Color(0xFF0F766E)))),
                  GestureDetector(
                    onTap: () => setState(() => _customClauses.removeAt(i)),
                    child: const Icon(Icons.close, size: 16, color: Colors.red),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _buildConfirmStep() {
    final theme = Theme.of(context);
    final selectedProp = _properties.where((p) => p['id'] == _selectedPropertyId).firstOrNull;
    final propAddress = (selectedProp?['address'] as Map<String, dynamic>?)?['fullText'] ?? '—';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Bilgileri kontrol edin.', style: TextStyle(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 16),
        _ConfirmRow(label: 'Kiracı', value: _tenantNameCtrl.text),
        _ConfirmRow(label: 'TCKN', value: _tenantTcknCtrl.text),
        _ConfirmRow(label: 'E-posta', value: _tenantEmailCtrl.text),
        _ConfirmRow(label: 'Taşınmaz', value: propAddress),
        _ConfirmRow(label: 'Aylık Kira', value: '${_rentAmountCtrl.text} TL'),
        _ConfirmRow(label: 'Depozito', value: '${(int.tryParse(_rentAmountCtrl.text.trim()) ?? 0) * 3} TL (2 ev sahibi, 1 platform)'),
        _ConfirmRow(label: 'Ödeme Günü', value: 'Her ayın ${_payDayCtrl.text}. günü'),
        _ConfirmRow(label: 'Gecikme Faizi', value: _lateFeeEnabled ? 'Aktif' : 'Pasif'),
        _ConfirmRow(label: 'Demirbaş', value: _fixtures.isNotEmpty ? '${_fixtures.length} adet' : 'Yok'),
        _ConfirmRow(label: 'Maddeler', value: '${_selectedClauses.length + _customClauses.length} madde'),
        if (_startDate != null)
          _ConfirmRow(label: 'Başlangıç', value: '${_startDate!.day}.${_startDate!.month}.${_startDate!.year}'),
      ],
    );
  }
}

class _ConfirmRow extends StatelessWidget {
  final String label;
  final String value;
  const _ConfirmRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
