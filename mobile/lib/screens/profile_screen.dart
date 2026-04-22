import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../services/language_provider.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final lang = context.watch<LanguageProvider>();

    final menuItems = [
      {'icon': Icons.person_outline,         'label': lang.t('edit_profile')},
      {'icon': Icons.lock_outline,           'label': lang.t('change_password')},
      {'icon': Icons.security_rounded,       'label': lang.t('two_factor')},
      {'icon': Icons.credit_card_rounded,    'label': lang.t('cards')},
      {'icon': Icons.notifications_outlined, 'label': lang.t('notifications')},
      {'icon': Icons.help_outline,           'label': lang.t('help')},
      {'icon': Icons.star_outline,           'label': lang.t('rate_app')},
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 160,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: Colors.white.withOpacity(0.2),
                      child: Text(
                        auth.fullName.isNotEmpty ? auth.fullName.substring(0, 1) : 'U',
                        style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(auth.fullName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                    Text(auth.phone, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13)),
                  ],
                ),
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Sélecteur de langue
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)]),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Langue / اللغة', style: TextStyle(fontWeight: FontWeight.w600)),
                      Row(
                        children: ['fr', 'ar'].map((loc) {
                          final active = lang.locale == loc;
                          return GestureDetector(
                            onTap: () => context.read<LanguageProvider>().setLocale(loc),
                            child: Container(
                              margin: const EdgeInsets.only(left: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: active ? AppColors.primary : Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(loc.toUpperCase(),
                                style: TextStyle(
                                  color: active ? Colors.white : AppColors.textSecondary,
                                  fontWeight: FontWeight.bold,
                                )),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Menu
                Container(
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)]),
                  child: Column(
                    children: menuItems.asMap().entries.map((entry) {
                      final i = entry.key;
                      final item = entry.value;
                      return Column(
                        children: [
                          ListTile(
                            leading: Container(
                              width: 36, height: 36,
                              decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(10)),
                              child: Icon(item['icon'] as IconData, color: AppColors.primary, size: 20),
                            ),
                            title: Text(item['label'] as String, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                            trailing: const Icon(Icons.chevron_right, color: AppColors.textHint),
                            onTap: () {},
                          ),
                          if (i < menuItems.length - 1) const Divider(height: 1, indent: 16, endIndent: 16),
                        ],
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 16),

                // Déconnexion
                ElevatedButton.icon(
                  onPressed: () async {
                    await context.read<AuthProvider>().logout();
                    if (!context.mounted) return;
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.error,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.logout_rounded, color: Colors.white),
                  label: Text(lang.t('logout'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
                ),
                const SizedBox(height: 8),
                const Center(child: Text('ECOPYE v1.0.0 · © 2025', style: TextStyle(color: AppColors.textHint, fontSize: 11))),
                const SizedBox(height: 80),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
