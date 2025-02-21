import { CloudFront } from '@aws-sdk/client-cloudfront';

export async function checkDistributionStatus(distributionId: string): Promise<boolean> {
  const cloudfront = new CloudFront({
    region: 'us-east-1', // CloudFront API is only available in us-east-1
  });

  try {
    const { Distribution } = await cloudfront.getDistribution({
      Id: distributionId,
    });

    if (!Distribution) {
      throw new Error('Distribution not found');
    }

    console.log(`Distribution Status: ${Distribution.Status}`);
    console.log(`Last Modified: ${Distribution.LastModifiedTime}`);
    
    if (Distribution.Status === 'InProgress') {
      console.log('Distribution is still updating...');
      return false;
    }

    if (Distribution.Status === 'Deployed') {
      console.log('Distribution update complete!');
      return true;
    }

    throw new Error(`Unexpected distribution status: ${Distribution.Status}`);
  } catch (error) {
    console.error('Error checking distribution status:', error);
    throw error;
  }
}