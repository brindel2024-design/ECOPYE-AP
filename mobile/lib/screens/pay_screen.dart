import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../services/language_provider.dart';
import '../theme/app_theme.dart';

final _merchants = [
  {'id': 'djezzy',    'name': 'Djezzy',        'category': 'Téléphonie', 'icon': Icons.phone_android},
  {'id': 'mobilis',   'name': 'Mobilis',        'category': 'Téléphonie', 'icon': Icons.smartphone},
  {'id': 'ooredoo',   'name': 'Ooredoo',        'category': 'Téléphonie', 'icon': Icons.phone},
  {'id': 'sonelgaz',  'name': 'Sonelgaz',       'category': 'Énergie',    'icon': Icons.flash_on},
  {'id': 'seaal',     'name': 'Seaal',          'category': 'Eau',        'icon': Icons.water},
  {'id': 'barid',     'name': 'Algérie Poste',  'category': 'Poste',      'icon': Icons.local_post_office},
  {'id': 'atm',       'name': 'ATM Mobilis',    'category': 'Banque',     'icon': Icons.credit_card},
  {'id': 'autre',     'name': 'Autre',          'category': 'Divers',     'icon': Icons.qr_code},
];

class PayScreen extends StatefulWidget {
  const PayScreen({super.key});
  @override
  State<PayScreen> createState() => _PayScreenState();
}

class _PayScreenState extends State<PayScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  Map<String, dynamic>? _selected;
  final _amountCtrl = TextEditingController();
  bool _loading = false;
  bool _success = false;
  String _txRef = '';
  String _error = '';

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  Future<void> _pay() async {
    final amount = double.tryParse(_amountCtrl.text);
    if (amount == null || amount < 100) {
      setState(() => _error = 'Montant minimum: 100 DZD');
      return;
    }
    setState(() { _loading = true; _error = ''; });
    try {
      final auth = context.read<AuthProvider>();
      final api  = ApiService(token: auth.token);
      final result = await api.payment(
        merchantName: _selected!['name'] as String,
        merchantId: _selected!['id'] as String,
        amount: amount,
      );
      await auth.refreshBalance();
      setState(() { _success = true; _txRef = result['reference'] ?? ''; });
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('pay')),
        bottom: TabBar(
          controller: _tab,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: [Tab(text: lang.t('merchant')), Tab(text: lang.t('qr'))],
        ),
      ),
      body: _success ? _buildSuccess() : TabBarView(
        controller: _tab,
        children: [_buildMerchantTab(), _buildQRTab()],
      ),
    );
  }

  Widget _buildMerchantTab() {
    if (_selected != null) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Marchand
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
              child: Row(
                children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
                    child: Icon(_selected!['icon'] as IconData, color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(_selected!['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(_selected!['category'] as String, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800),
              decoration: const InputDecoration(labelText: 'Montant (DZD)', hintText: '0'),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: [500, 1000, 5000, 10000].map((a) => GestureDetector(
                onTap: () => _amountCtrl.text = a.toString(),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Text('$a DZD', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                ),
              )).toList(),
            ),
            if (_error.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(_error, style: const TextStyle(color: AppColors.error)),
            ],
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: OutlinedButton(onPressed: () => setState(() => _selected = null), child: const Text('Retour'))),
              const SizedBox(width: 12),
              Expanded(child: ElevatedButton(
                onPressed: _loading ? null : _pay,
                child: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Payer'),
              )),
            ]),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.4),
      itemCount: _merchants.length,
      itemBuilder: (_, i) {
        final m = _merchants[i];
        return GestureDetector(
          onTap: () => setState(() => _selected = m),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
            child: Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: Icon(m['icon'] as IconData, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(m['name'] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    Text(m['category'] as String, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                  ],
                )),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildQRTab() {
    final auth = context.watch<AuthProvider>();
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Mon QR Code', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Présentez ce code pour recevoir un paiement',
              style: TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20)]),
              child: QrImageView(
                data: 'ECOPYE:${auth.phone}',
                version: QrVersions.auto,
                size: 200,
                eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: AppColors.primary),
                dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: AppColors.textPrimary),
              ),
            ),
            const SizedBox(height: 16),
            Text(auth.phone, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Text(auth.fullName, style: const TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccess() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 90, height: 90,
              decoration: BoxDecoration(color: AppColors.success.withOpacity(0.1), shape: BoxShape.circle),
              child: const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 52),
            ),
            const SizedBox(height: 20),
            const Text('Paiement réussi !', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            if (_txRef.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('Réf: $_txRef', style: const TextStyle(color: AppColors.textHint, fontSize: 12)),
            ],
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => setState(() { _success = false; _selected = null; _amountCtrl.clear(); }),
              child: const Text('Nouveau paiement'),
            ),
          ],
        ),
      ),
    );
  }
}
