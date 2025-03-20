import { useState } from 'react'
import { TabPanels, TabPanel } from '@chakra-ui/react'
import { CampaignBlock } from './CampaignBlock'
import { LeadBlock } from './LeadBlock'
import { CampaignTable } from './CampaignTable'
import { CampaignDetail } from './CampaignDetail'
import { LeadTable } from './LeadTable'
export function Navigation() {
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  return (
    <TabPanels>
      <TabPanel px={0}>
        <CampaignBlock />
      </TabPanel>
      <TabPanel px={0}>
        {selectedCampaign ? (
          <CampaignDetail
            campaign={selectedCampaign}
            onBack={() => setSelectedCampaign(null)}
          />
        ) : (
          <CampaignTable
            campaigns={[]}
            onCampaignSelect={setSelectedCampaign}
          />
        )}
      </TabPanel>
      <TabPanel px={0}>
        <LeadBlock />
      </TabPanel>
      <TabPanel px={0}>
        <LeadTable />
      </TabPanel>
    </TabPanels>
  )
}
