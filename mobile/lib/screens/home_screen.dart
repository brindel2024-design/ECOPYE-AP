import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../services/language_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/wallet_card.dart';
import '../widgets/quick_action_btn.dart';
import '../widgets/transaction_tile.dart';
import 'transfer_screen.dart';
import 'pay_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    _Dashboard(),
    TransferScreen(),
    PayScreen(),
    HistoryScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -2))],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          elevation: 0,
          backgroundColor: Colors.white,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: const Color(0xFF94A3B8),
          type: BottomNavigationBarType.fixed,
          items: [
            BottomNavigationBarItem(icon: const Icon(Icons.home_rounded), label: lang.t('home')),
            BottomNavigationBarItem(icon: const Icon(Icons.send_rounded), label: lang.t('transfer')),
            BottomNavigationBarItem(
              icon: Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 4))],
                ),
                child: const Icon(Icons.qr_code_scanner_rounded, color: Colors.white, size: 26),
              ),
              label: lang.t('pay'),
            ),
            BottomNavigationBarItem(icon: const Icon(Icons.history_rounded), label: lang.t('history')),
            BottomNavigationBarItem(icon: const Icon(Icons.person_rounded), label: lang.t('profile')),
          ],
        ),
      ),
    );
  }
}

class _Dashboard extends StatefulWidget {
  const _Dashboard();
  @override
  State<_Dashboard> createState() => _DashboardState();
}

class _DashboardState extends State<_Dashboard> {
  List<dynamic> _transactions = [];
  bool _loadingTx = true;

  @override
  void initState() {
    super.initState();
    _loadTransactions();
    context.read<AuthProvider>().refreshBalance();
  }

  Future<void> _loadTransactions() async {
    // Charger les dernières transactions
    setState(() => _loadingTx = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final lang = context.watch<LanguageProvider>();
    final hour = DateTime.now().hour;
    final greeting = hour < 12 ? lang.t('greeting_morning') : lang.t('greeting_afternoon');
    final firstName = auth.fullName.split(' ').first;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async => auth.refreshBalance(),
        child: CustomScrollView(
          slivers: [
            // AppBar avec dégradé
            SliverAppBar(
              expandedHeight: 0,
              floating: true,
              backgroundColor: AppColors.primary,
              title: Row(
                children: [
                  Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.account_balance_wallet, color: Colors.white, size: 18),
                  ),
                  const SizedBox(width: 8),
                  const Text('ECOPYE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1.5, fontSize: 20)),
                ],
              ),
              actions: [
                // Sélecteur de langue
                Container(
                  margin: const EdgeInsets.only(right: 4),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: ['fr', 'ar'].map((loc) {
                      final active = context.watch<LanguageProvider>().locale == loc;
                      return GestureDetector(
                        onTap: () => context.read<LanguageProvider>().setLocale(loc),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: active ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(loc.toUpperCase(),
                            style: TextStyle(
                              color: active ? AppColors.primary : Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                IconButton(icon: const Icon(Icons.notifications_none_rounded, color: Colors.white), onPressed: () {}),
                const SizedBox(width: 4),
              ],
            ),

            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Salutation
                  Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('$greeting 👋', style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
                          Text(firstName, style: const TextStyle(color: AppColors.textPrimary, fontSize: 22, fontWeight: FontWeight.w800)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Carte portefeuille
                  WalletCard(balance: auth.balance, ownerName: auth.fullName, phone: auth.phone),
                  const SizedBox(height: 20),

                  // Actions rapides
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)]),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        QuickActionBtn(icon: Icons.send_rounded, label: lang.t('send'), color: Colors.blue, onTap: () {}),
                        QuickActionBtn(icon: Icons.qr_code_scanner_rounded, label: lang.t('scan'), color: Colors.purple, onTap: () {}),
                        QuickActionBtn(icon: Icons.add_circle_outline_rounded, label: lang.t('topup'), color: Colors.green, onTap: () {}),
                        QuickActionBtn(icon: Icons.receipt_long_rounded, label: lang.t('bills'), color: Colors.orange, onTap: () {}),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Bannière promo
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd, AppColors.gold], stops: [0.0, 0.6, 1.0]),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(lang.t('special_offer'), style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
                              const SizedBox(height: 4),
                              Text(lang.t('free_transfer'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                            ],
                          ),
                        ),
                        const Icon(Icons.arrow_forward_rounded, color: Colors.white),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Transactions récentes
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(lang.t('recent'), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppColors.textPrimary)),
                      Text(lang.t('history'), style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Transactions mock
                  Container(
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)]),
                    child: Column(
                      children: [
                        TransactionTile(title: 'Ahmed Benali', subtitle: 'Transfert reçu', amount: 5000, isPositive: true),
                        const Divider(height: 1, indent: 16, endIndent: 16),
                        TransactionTile(title: 'Carrefour Alger', subtitle: 'Paiement marchand', amount: 4500, isPositive: false),
                        const Divider(height: 1, indent: 16, endIndent: 16),
                        TransactionTile(title: 'Sonelgaz', subtitle: 'Facture électricité', amount: 2800, isPositive: false),
                      ],
                    ),
                  ),
                  const SizedBox(height: 80),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Extension pour les traductions dans la langue actuelle
extension on LanguageProvider {
  String get greeting_morning => t('greeting_morning');
  String get greeting_afternoon => t('greeting_afternoon');
}
