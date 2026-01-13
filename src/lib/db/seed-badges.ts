/**
 * Script de seed pour les badges Trophy Case 2.0
 * 
 * Exécuter avec : npx tsx src/lib/db/seed-badges.ts
 */

import { db } from './index';
import { badges } from './schema';
import { getBadgeSeedData } from '../gamification/badges';
import { sql } from 'drizzle-orm';

async function seedBadges() {
  console.log('🏆 Seeding badges...');
  
  const badgeData = getBadgeSeedData();
  
  try {
    // Upsert des badges (insert ou update si existe)
    for (const badge of badgeData) {
      await db
        .insert(badges)
        .values(badge)
        .onConflictDoUpdate({
          target: badges.id,
          set: {
            name: badge.name,
            description: badge.description,
            criteria: badge.criteria,
            category: badge.category,
            tier: badge.tier,
            icon: badge.icon,
            iconColor: badge.iconColor,
            sortOrder: badge.sortOrder,
            isActive: badge.isActive,
            isDynamic: badge.isDynamic,
            maxProgress: badge.maxProgress,
          },
        });
      
      console.log(`  ✅ ${badge.name} (${badge.tier})`);
    }
    
    console.log(`\n🎉 ${badgeData.length} badges seeded successfully!`);
    
    // Afficher le résumé par tier
    const summary = badgeData.reduce((acc, b) => {
      acc[b.tier] = (acc[b.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📊 Summary:');
    console.log(`  - Common: ${summary.common || 0}`);
    console.log(`  - Rare: ${summary.rare || 0}`);
    console.log(`  - Epic: ${summary.epic || 0}`);
    console.log(`  - Legendary: ${summary.legendary || 0}`);
    
  } catch (error) {
    console.error('❌ Error seeding badges:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedBadges()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedBadges };
