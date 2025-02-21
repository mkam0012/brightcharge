import { checkDistributionStatus } from './lib/check-distribution';

async function main() {
  const distributionId = process.argv[2];
  
  if (!distributionId) {
    console.error('Please provide the distribution ID as an argument');
    process.exit(1);
  }

  try {
    let isDeployed = false;
    while (!isDeployed) {
      isDeployed = await checkDistributionStatus(distributionId);
      if (!isDeployed) {
        // Wait 30 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  } catch (error) {
    console.error('Failed to check distribution status:', error);
    process.exit(1);
  }
}

main();