import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../services/language_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/transaction_tile.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});
  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<dynamic> _transactions = [];
  bool _loading = true;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthProvider>();
      final api  = ApiService(token: auth.token);
      final txs  = await api.getTransactions();
      setState(() => _transactions = txs);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    final filters = [
      {'value': 'all',      'label': lang.t('all')},
      {'value': 'sent',     'label': lang.t('sent')},
      {'value': 'received', 'label': lang.t('received')},
      {'value': 'payment',  'label': lang.t('pay')},
    ];

    final filtered = _filter == 'all'
        ? _transactions
        : _transactions.where((t) => t['type'] == _filter).toList();

    return Scaffold(
      appBar: AppBar(title: Text(lang.t('history'))),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary,
        child: Column(
          children: [
            // Filtres
            Container(
              height: 48,
              color: AppColors.primary,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                children: filters.map((f) {
                  final active = _filter == f['value'];
                  return GestureDetector(
                    onTap: () => setState(() => _filter = f['value']!),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: active ? Colors.white : Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Center(child: Text(f['label']!,
                        style: TextStyle(
                          color: active ? AppColors.primary : Colors.white,
                          fontWeight: FontWeight.w600, fontSize: 13,
                        ),
                      )),
                    ),
                  );
                }).toList(),
              ),
            ),

            // Liste
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : filtered.isEmpty
                      ? Center(
                          child: Column(mainAxisSize: MainAxisSize.min, children: [
                            Icon(Icons.history_rounded, size: 60, color: Colors.grey.shade300),
                            const SizedBox(height: 12),
                            Text(lang.t('no_results'), style: const TextStyle(color: AppColors.textSecondary)),
                          ]),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (_, i) {
                            final tx = filtered[i];
                            return TransactionTile(
                              title: tx['title'] ?? tx['merchantName'] ?? '—',
                              subtitle: tx['subtitle'] ?? tx['description'] ?? '',
                              amount: (tx['amount'] as num).toDouble(),
                              isPositive: tx['type'] == 'received',
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
