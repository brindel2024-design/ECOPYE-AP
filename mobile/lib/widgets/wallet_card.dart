import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class WalletCard extends StatefulWidget {
  final double balance;
  final String ownerName;
  final String phone;

  const WalletCard({super.key, required this.balance, required this.ownerName, required this.phone});

  @override
  State<WalletCard> createState() => _WalletCardState();
}

class _WalletCardState extends State<WalletCard> {
  bool _showBalance = true;

  String _formatDZD(double amount) {
    return '${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} DZD';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft, end: Alignment.bottomRight,
          colors: [AppColors.gradientStart, AppColors.gradientEnd, AppColors.gold],
          stops: [0.0, 0.6, 1.0],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // En-tête
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Portefeuille ECOPYE', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                  const SizedBox(height: 2),
                  Text(widget.ownerName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
                ],
              ),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                    child: const Text('DZD', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                    child: const Center(child: Text('ع', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold))),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Solde
          Row(
            children: [
              Text('Solde disponible', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13)),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: () => setState(() => _showBalance = !_showBalance),
                child: Icon(
                  _showBalance ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: Colors.white.withOpacity(0.7), size: 18,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            _showBalance ? _formatDZD(widget.balance) : '••••• DZD',
            style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 20),

          // Numéro de téléphone
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              widget.phone,
              style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12, fontFamily: 'monospace', letterSpacing: 2),
            ),
          ),
        ],
      ),
    );
  }
}
