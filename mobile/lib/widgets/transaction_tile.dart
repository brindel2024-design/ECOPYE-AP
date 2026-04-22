import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class TransactionTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final double amount;
  final bool isPositive;

  const TransactionTile({super.key, required this.title, required this.subtitle, required this.amount, required this.isPositive});

  String _formatDZD(double a) =>
    '${isPositive ? '+' : '-'} ${a.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} DZD';

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: isPositive ? AppColors.success.withOpacity(0.1) : Colors.red.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(
          isPositive ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
          color: isPositive ? AppColors.success : Colors.red,
          size: 20,
        ),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      trailing: Text(
        _formatDZD(amount),
        style: TextStyle(
          fontWeight: FontWeight.w700, fontSize: 14,
          color: isPositive ? AppColors.success : AppColors.textPrimary,
        ),
      ),
    );
  }
}
