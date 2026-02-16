import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String ownerUid;
  final String contractId;
  final String invoiceId;
  final String authToken;

  const PaymentWebViewScreen({
    super.key,
    required this.ownerUid,
    required this.contractId,
    required this.invoiceId,
    required this.authToken,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  bool _loading = true;
  String? _error;
  String? _paymentUrl;

  @override
  void initState() {
    super.initState();
    _initPayment();
  }

  Future<void> _initPayment() async {
    try {
      final resp = await http.post(
        Uri.parse('https://us-central1-superapp-37db4.cloudfunctions.net/createIyzicoCheckout'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.authToken}',
        },
        body: jsonEncode({
          'ownerUid': widget.ownerUid,
          'contractId': widget.contractId,
          'invoiceId': widget.invoiceId,
        }),
      );

      if (resp.statusCode != 200) {
        final data = jsonDecode(resp.body);
        setState(() {
          _error = data['error'] ?? 'Ödeme başlatılamadı.';
          _loading = false;
        });
        return;
      }

      final data = jsonDecode(resp.body);
      final url = data['paymentPageUrl'] as String?;

      if (url == null || url.isEmpty) {
        setState(() {
          _error = 'Ödeme sayfası oluşturulamadı.';
          _loading = false;
        });
        return;
      }

      _paymentUrl = url;

      // Open payment URL in browser
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Hata: $e';
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ödeme'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context, false),
        ),
      ),
      body: _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
                    const SizedBox(height: 16),
                    Text(_error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 16)),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Geri Dön'),
                    ),
                  ],
                ),
              ),
            )
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.open_in_new, size: 64, color: theme.colorScheme.primary.withValues(alpha: 0.6)),
                        const SizedBox(height: 20),
                        const Text(
                          'Ödeme sayfası açıldı',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Ödeme sayfası tarayıcınızda açıldı.\nÖdemeyi tamamladıktan sonra buraya dönebilirsiniz.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                        ),
                        const SizedBox(height: 28),
                        if (_paymentUrl != null)
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                final uri = Uri.parse(_paymentUrl!);
                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                                }
                              },
                              icon: const Icon(Icons.open_in_new),
                              label: const Text('Ödeme Sayfasını Tekrar Aç',
                                  style: TextStyle(fontWeight: FontWeight.w600)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: theme.colorScheme.primary,
                                foregroundColor: theme.colorScheme.onPrimary,
                              ),
                            ),
                          ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Ödemeyi Tamamladım'),
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: Text('Geri Dön',
                              style: TextStyle(color: Colors.grey.shade500)),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}
