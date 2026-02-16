import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class RequestChatScreen extends StatefulWidget {
  final String ownerUid;
  final String contractId;
  final String requestId;
  final String requestType;
  final String requestStatus;

  const RequestChatScreen({
    super.key,
    required this.ownerUid,
    required this.contractId,
    required this.requestId,
    required this.requestType,
    required this.requestStatus,
  });

  @override
  State<RequestChatScreen> createState() => _RequestChatScreenState();
}

class _RequestChatScreenState extends State<RequestChatScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _sending = false;

  bool get _isClosed => widget.requestStatus != 'PENDING';

  String get _collectionPath =>
      'accounts/${widget.ownerUid}/contracts/${widget.contractId}/requests/${widget.requestId}/messages';

  Future<void> _send() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _isClosed) return;
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _sending = true);
    try {
      await FirebaseFirestore.instance.collection(_collectionPath).add({
        'text': text,
        'senderUid': user.uid,
        'senderName': user.displayName ?? user.email ?? 'Kullanıcı',
        'senderRole': 'unknown',
        'createdAt': FieldValue.serverTimestamp(),
      });
      _msgCtrl.clear();
      _scrollToBottom();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Hata: $e')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 150), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = FirebaseAuth.instance.currentUser;
    final typeMap = {
      'REPAIR_REQUEST': 'Bakım / Onarım',
      'DAMAGE_REQUEST': 'Hasar Talebi',
      'PAYMENT_REQUEST': 'Ödeme Talebi',
      'CONTACT_UPDATE': 'İletişim Güncelleme',
      'RENEWAL_OFFER': 'Kira Artış Talebi',
      'GENERAL_REQUEST': 'Genel Talep',
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(typeMap[widget.requestType] ?? 'Talep Sohbeti'),
        bottom: _isClosed
            ? PreferredSize(
                preferredSize: const Size.fromHeight(32),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  color: const Color(0xFFFEF3C7),
                  child: const Text(
                    'Bu talep kapatıldı. Sohbet salt okunur.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Color(0xFF92400E), fontWeight: FontWeight.w500),
                  ),
                ),
              )
            : null,
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection(_collectionPath)
                  .orderBy('createdAt', descending: false)
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final docs = snapshot.data?.docs ?? [];
                if (docs.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.chat_bubble_outline, size: 48, color: Colors.grey.shade300),
                        const SizedBox(height: 12),
                        const Text('Henüz mesaj yok', style: TextStyle(color: Color(0xFF94A3B8))),
                        const SizedBox(height: 4),
                        const Text('İlk mesajı gönderin.', style: TextStyle(fontSize: 12, color: Color(0xFFCBD5E1))),
                      ],
                    ),
                  );
                }

                WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

                return ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: docs.length,
                  itemBuilder: (context, index) {
                    final data = docs[index].data() as Map<String, dynamic>;
                    final isMe = data['senderUid'] == user?.uid;
                    final time = (data['createdAt'] as Timestamp?)?.toDate();

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
                        children: [
                          Container(
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: isMe ? theme.colorScheme.primary : Colors.white,
                              borderRadius: BorderRadius.only(
                                topLeft: const Radius.circular(16),
                                topRight: const Radius.circular(16),
                                bottomLeft: Radius.circular(isMe ? 16 : 4),
                                bottomRight: Radius.circular(isMe ? 4 : 16),
                              ),
                              border: isMe ? null : Border.all(color: const Color(0xFFE2E8F0)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.04),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (!isMe)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 2),
                                    child: Text(
                                      data['senderName'] ?? '',
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: theme.colorScheme.primary),
                                    ),
                                  ),
                                Text(
                                  data['text'] ?? '',
                                  style: TextStyle(fontSize: 14, color: isMe ? Colors.white : const Color(0xFF1E293B)),
                                ),
                                if (time != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 4),
                                    child: Text(
                                      '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: isMe ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF94A3B8),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),

          // Input bar
          if (!_isClosed)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Colors.grey.shade200)),
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _msgCtrl,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _send(),
                        decoration: InputDecoration(
                          hintText: 'Mesajınızı yazın...',
                          hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Material(
                      color: theme.colorScheme.primary,
                      borderRadius: BorderRadius.circular(24),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(24),
                        onTap: _sending ? null : _send,
                        child: Container(
                          width: 44,
                          height: 44,
                          alignment: Alignment.center,
                          child: _sending
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.send, color: Colors.white, size: 20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
