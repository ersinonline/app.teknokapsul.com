import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'create_request_screen.dart';
import 'request_chat_screen.dart';

class RequestsScreen extends StatefulWidget {
  final String activeRole;
  const RequestsScreen({super.key, this.activeRole = 'landlord'});

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _requests = [];
  Map<String, dynamic>? _memberData;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant RequestsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeRole != widget.activeRole) _load();
  }

  Future<void> _load() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    setState(() => _loading = true);

    try {
      final memberSnap = await FirebaseFirestore.instance.doc('accounts/${user.uid}/members/${user.uid}').get();
      if (memberSnap.exists) _memberData = memberSnap.data();

      final snap = await FirebaseFirestore.instance.collectionGroup('requests').get();
      final items = <Map<String, dynamic>>[];
      final userEmail = user.email?.toLowerCase() ?? '';

      for (final d in snap.docs) {
        final data = d.data();
        final ownerUid = data['ownerUid'] ?? data['landlordUid'];
        final tenantEmail = (data['tenantEmail'] as String?)?.toLowerCase() ?? '';

        final fromRole = data['fromRole'] as String?;
        final toRole = data['toRole'] as String?;

        if (widget.activeRole == 'landlord') {
          // Ev sahibi modunda: sadece ev sahibi olduğum sözleşmelerdeki talepler
          final isMyProperty = ownerUid == user.uid || data['landlordUid'] == user.uid;
          if (!isMyProperty) continue;
          if (fromRole != 'landlord' && fromRole != 'agent' && toRole != 'landlord' && toRole != 'agent') continue;
        } else {
          // Kiracı modunda: sadece kiracı olduğum sözleşmelerdeki talepler
          final isMyTenant = userEmail.isNotEmpty && tenantEmail == userEmail;
          if (!isMyTenant) continue;
          if (fromRole != 'tenant' && toRole != 'tenant') continue;
        }

        items.add({'id': d.id, 'ref': d.reference, ...data});
      }
      items.sort((a, b) {
        final sa = _statusOrder(a['status']);
        final sb = _statusOrder(b['status']);
        return sa.compareTo(sb);
      });
      if (mounted) setState(() { _requests = items; _loading = false; });
    } catch (e) {
      debugPrint('Requests load error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  int _statusOrder(String? s) {
    switch (s) { case 'PENDING': return 0; case 'APPROVED': return 1; case 'REJECTED': return 2; default: return 3; }
  }

  String _typeLabel(String? type) {
    switch (type) {
      case 'UPFRONT_OFFER': return 'Peşin Ödeme Teklifi';
      case 'RENEWAL_OFFER': return 'Kira Artış Talebi';
      case 'RENT_INCREASE': return 'Kira Artış Talebi';
      case 'DAMAGE_REQUEST': return 'Hasar Talebi';
      case 'PAYMENT_REQUEST': return 'Ödeme Talebi';
      case 'REPAIR_REQUEST': return 'Bakım / Onarım';
      case 'CANCEL_REQUEST': return 'Sözleşme İptal Talebi';
      case 'CONTACT_UPDATE': return 'İletişim Güncelleme';
      default: return type ?? 'Genel Talep';
    }
  }

  String _statusLabel(String? s) {
    switch (s) { case 'PENDING': return 'Bekliyor'; case 'APPROVED': return 'Onaylandı'; case 'REJECTED': return 'Reddedildi'; case 'CLOSED': return 'Kapandı'; default: return s ?? '—'; }
  }

  Color _statusColor(String? s) {
    switch (s) { case 'APPROVED': return const Color(0xFF22C55E); case 'REJECTED': return const Color(0xFFEF4444); default: return const Color(0xFFF59E0B); }
  }

  bool _canAct(Map<String, dynamic> req) {
    if (req['status'] != 'PENDING') return false;
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return false;
    // Only show action buttons if the request is directed TO the current active role
    if (req['toRole'] == 'landlord' && widget.activeRole == 'landlord') return true;
    if (req['toRole'] == 'tenant' && widget.activeRole == 'tenant') return true;
    return false;
  }

  Future<void> _updateStatus(Map<String, dynamic> req, String status) async {
    try {
      final ref = req['ref'] as DocumentReference;
      await ref.update({'status': status, 'updatedAt': FieldValue.serverTimestamp()});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(status == 'APPROVED' ? 'Talep onaylandı.' : 'Talep reddedildi.'), backgroundColor: const Color(0xFF0F766E)),
        );
      }
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hata: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) {
      return Scaffold(
        body: const Center(child: CircularProgressIndicator()),
        floatingActionButton: _buildFab(theme),
      );
    }

    if (_requests.isEmpty) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.inbox_outlined, size: 64, color: Colors.grey.shade300),
                const SizedBox(height: 16),
                const Text('Henüz talep yok', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                const SizedBox(height: 6),
                const Text('Sözleşmelerinize ait talepler burada görünecek.', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => _openCreateRequest(context),
                  icon: const Icon(Icons.add),
                  label: const Text('Talep Oluştur'),
                ),
              ],
            ),
          ),
        ),
        floatingActionButton: _buildFab(theme),
      );
    }

    final df = DateFormat('dd.MM.yyyy');
    final pendingCount = _requests.where((r) => r['status'] == 'PENDING').length;
    final approvedCount = _requests.where((r) => r['status'] == 'APPROVED').length;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Stats bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  _MiniStat(count: _requests.length, label: 'Toplam', color: const Color(0xFF64748B)),
                  Container(width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                  _MiniStat(count: pendingCount, label: 'Bekleyen', color: const Color(0xFFF59E0B)),
                  Container(width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                  _MiniStat(count: approvedCount, label: 'Onaylı', color: const Color(0xFF22C55E)),
                ],
              ),
            ),
            ..._requests.map((req) {
              final color = _statusColor(req['status']);
              final createdAt = (req['createdAt'] as Timestamp?)?.toDate();
              final images = _getImages(req);

              return GestureDetector(
                onTap: () => _showRequestDetail(req),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
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
                            width: 40, height: 40,
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(_typeIcon(req['type']), color: color, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(_typeLabel(req['type']), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF0F172A))),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Text(
                                      req['fromRole'] == 'landlord' ? 'Ev Sahibi' : req['fromRole'] == 'tenant' ? 'Kiracı' : '—',
                                      style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                    ),
                                    if (createdAt != null) ...[
                                      const Text(' • ', style: TextStyle(fontSize: 11, color: Color(0xFFCBD5E1))),
                                      Text(df.format(createdAt), style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                            child: Text(_statusLabel(req['status']), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
                          ),
                        ],
                      ),
                      if (req['message'] != null && (req['message'] as String).isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: Text(req['message'], style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)), maxLines: 2, overflow: TextOverflow.ellipsis),
                        ),
                      if (req['amount'] != null && req['amount'] != 0)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: const Color(0xFFDBEAFE), borderRadius: BorderRadius.circular(6)),
                            child: Text('${req['amount']} TL', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF3B82F6))),
                          ),
                        ),
                      if (images.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: SizedBox(
                            height: 56,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: images.length,
                              separatorBuilder: (_, __) => const SizedBox(width: 6),
                              itemBuilder: (_, i) => GestureDetector(
                                onTap: () => _showFullImage(context, images[i]),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: _buildImage(images[i], 56, 56),
                                ),
                              ),
                            ),
                          ),
                        ),
                      if (_canAct(req)) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 36,
                                child: ElevatedButton(
                                  onPressed: () => _updateStatus(req, 'APPROVED'),
                                  style: ElevatedButton.styleFrom(padding: EdgeInsets.zero, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                                  child: const Text('Onayla', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: SizedBox(
                                height: 36,
                                child: OutlinedButton(
                                  onPressed: () => _updateStatus(req, 'REJECTED'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: const Color(0xFFEF4444),
                                    side: const BorderSide(color: Color(0xFFEF4444)),
                                    padding: EdgeInsets.zero,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  child: const Text('Reddet', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
      floatingActionButton: _buildFab(theme),
    );
  }

  IconData _typeIcon(String? type) {
    switch (type) {
      case 'REPAIR_REQUEST': return Icons.build_outlined;
      case 'UPFRONT_OFFER': return Icons.payments_outlined;
      case 'RENT_INCREASE': case 'RENEWAL_OFFER': return Icons.trending_up;
      case 'CANCEL_REQUEST': return Icons.cancel_outlined;
      case 'DAMAGE_REQUEST': return Icons.warning_amber_outlined;
      default: return Icons.inbox_outlined;
    }
  }

  Widget _buildFab(ThemeData theme) {
    return FloatingActionButton.extended(
      onPressed: () => _openCreateRequest(context),
      backgroundColor: theme.colorScheme.primary,
      foregroundColor: Colors.white,
      icon: const Icon(Icons.add),
      label: const Text('Yeni Talep', style: TextStyle(fontWeight: FontWeight.w600)),
    );
  }

  List<String> _getImages(Map<String, dynamic> req) {
    final raw = req['images'];
    if (raw == null) return [];
    if (raw is List) return raw.whereType<String>().where((s) => s.isNotEmpty).toList();
    return [];
  }

  bool _isBase64(String s) => s.startsWith('data:image');

  Widget _buildImage(String src, double w, double h) {
    if (_isBase64(src)) {
      try {
        final parts = src.split(',');
        if (parts.length == 2) {
          final bytes = Uri.parse(src).data?.contentAsBytes();
          if (bytes != null) {
            return Image.memory(bytes, width: w, height: h, fit: BoxFit.cover);
          }
        }
      } catch (_) {}
      return Container(width: w, height: h, color: const Color(0xFFF1F5F9), child: const Icon(Icons.broken_image, color: Color(0xFF94A3B8)));
    }
    return Image.network(src, width: w, height: h, fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => Container(width: w, height: h, color: const Color(0xFFF1F5F9), child: const Icon(Icons.broken_image, color: Color(0xFF94A3B8))),
    );
  }

  Widget _buildFullImage(String src) {
    if (_isBase64(src)) {
      try {
        final bytes = Uri.parse(src).data?.contentAsBytes();
        if (bytes != null) return Image.memory(bytes, fit: BoxFit.contain);
      } catch (_) {}
      return const Icon(Icons.broken_image, color: Colors.white, size: 48);
    }
    return Image.network(src, fit: BoxFit.contain);
  }

  void _showFullImage(BuildContext ctx, String src) {
    showDialog(
      context: ctx,
      builder: (_) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: const EdgeInsets.all(8),
        child: Stack(
          children: [
            Center(child: InteractiveViewer(child: _buildFullImage(src))),
            Positioned(
              top: 8, right: 8,
              child: IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close, color: Colors.white, size: 28)),
            ),
          ],
        ),
      ),
    );
  }

  void _showRequestDetail(Map<String, dynamic> req) {
    final theme = Theme.of(context);
    final df = DateFormat('dd.MM.yyyy HH:mm');
    final color = _statusColor(req['status']);
    final createdAt = (req['createdAt'] as Timestamp?)?.toDate();
    final detailImages = _getImages(req);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        maxChildSize: 0.95,
        minChildSize: 0.4,
        builder: (_, scrollCtrl) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.all(20),
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Row(
                children: [
                  Expanded(child: Text(_typeLabel(req['type']), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                    child: Text(_statusLabel(req['status']), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (req['message'] != null && (req['message'] as String).isNotEmpty) ...[
                const Text('Mesaj', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8))),
                const SizedBox(height: 4),
                Text(req['message'], style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 16),
              ],
              Row(
                children: [
                  Expanded(child: _DetailItem(label: 'Gönderen', value: req['fromRole'] == 'landlord' ? 'Ev Sahibi' : req['fromRole'] == 'tenant' ? 'Kiracı' : req['fromRole'] ?? '—')),
                  Expanded(child: _DetailItem(label: 'Tarih', value: createdAt != null ? df.format(createdAt) : '—')),
                ],
              ),
              const SizedBox(height: 12),
              if (req['amount'] != null && req['amount'] != 0) ...[
                _DetailItem(label: 'Tutar', value: '${req['amount']} TL'),
                const SizedBox(height: 12),
              ],
              // Peşin ödeme detayları
              if (req['type'] == 'UPFRONT_OFFER') ...[
                if (req['unpaidTotal'] != null)
                  _DetailItem(label: 'Toplam Borç', value: '${req['unpaidTotal']} TL'),
                if (req['discountPercent'] != null)
                  _DetailItem(label: 'İndirim', value: '%${req['discountPercent']}'),
                if (req['discountedTotal'] != null)
                  _DetailItem(label: 'Ödenecek', value: '${req['discountedTotal']} TL'),
                const SizedBox(height: 12),
                if (req['status'] == 'APPROVED' && req['paymentUrl'] != null)
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _openPaymentUrl(req['paymentUrl']);
                      },
                      icon: const Icon(Icons.payment),
                      label: Text('Peşin Ödeme Yap (${req['discountedTotal'] ?? req['unpaidTotal'] ?? ''} TL)'),
                    ),
                  ),
                if (req['status'] == 'APPROVED' && req['paymentUrl'] == null)
                  const Text('Onaylandı. Ödeme linki oluşturuluyor...', style: TextStyle(fontSize: 13, color: Color(0xFF22C55E))),
                const SizedBox(height: 12),
              ],
              // Kira artış detayları
              if (req['type'] == 'RENT_INCREASE' || req['type'] == 'RENEWAL_OFFER') ...[
                if (req['newRent'] != null)
                  _DetailItem(label: 'Yeni Kira', value: '${req['newRent']} TL'),
                if (req['effectiveMonth'] != null)
                  _DetailItem(label: 'Geçerlilik', value: '${req['effectiveMonth']}. aydan itibaren'),
                const SizedBox(height: 12),
              ],
              // Fotoğraflar
              if (detailImages.isNotEmpty) ...[
                const Text('Fotoğraflar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8))),
                const SizedBox(height: 8),
                SizedBox(
                  height: 120,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: detailImages.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, i) => GestureDetector(
                      onTap: () => _showFullImage(context, detailImages[i]),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: _buildImage(detailImages[i], 120, 120),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              // Sohbet butonu
              SizedBox(
                width: double.infinity,
                height: 44,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => RequestChatScreen(
                      ownerUid: req['ownerUid'] ?? '',
                      contractId: req['contractId'] ?? '',
                      requestId: req['id'] ?? '',
                      requestType: req['type'] ?? '',
                      requestStatus: req['status'] ?? '',
                    )));
                  },
                  icon: const Icon(Icons.chat_bubble_outline, size: 18),
                  label: const Text('Sohbet'),
                ),
              ),
              if (_canAct(req)) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 44,
                        child: ElevatedButton(
                          onPressed: () { Navigator.pop(ctx); _updateStatus(req, 'APPROVED'); },
                          child: const Text('Onayla'),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SizedBox(
                        height: 44,
                        child: OutlinedButton(
                          onPressed: () { Navigator.pop(ctx); _updateStatus(req, 'REJECTED'); },
                          style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFFEF4444), side: const BorderSide(color: Color(0xFFEF4444))),
                          child: const Text('Reddet'),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openPaymentUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ödeme sayfası açılamadı.'), backgroundColor: Color(0xFFEF4444)),
        );
      }
    }
  }

  Future<void> _openCreateRequest(BuildContext ctx) async {
    final result = await Navigator.push(ctx, MaterialPageRoute(builder: (_) => CreateRequestScreen(activeRole: widget.activeRole)));
    if (result == true) _load();
  }
}

class _MiniStat extends StatelessWidget {
  final int count;
  final String label;
  final Color color;
  const _MiniStat({required this.count, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text('$count', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: color)),
        ],
      ),
    );
  }
}

class _DetailItem extends StatelessWidget {
  final String label;
  final String value;
  const _DetailItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8))),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
