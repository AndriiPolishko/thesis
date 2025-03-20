import { useState } from 'react'
import { TabPanels, TabPanel } from '@chakra-ui/react'
import { CampaignBlock } from '../Campaign/CampaignBlock'
import { LeadBlock } from '../Lead/LeadBlock'
import { CampaignTable } from '../Campaign/CampaignTable'
import { CampaignDetail } from '../Campaign/CampaignDetail'
import { LeadTable } from '../Lead/LeadTable'
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
