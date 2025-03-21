import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'

import { CampaignBlock } from '../Campaign/CampaignBlock'
import { LeadBlock } from '../Lead/LeadBlock'
import { CampaignTable } from '../Campaign/CampaignTable'
import { CampaignDetail } from '../Campaign/CampaignDetail'
import { LeadTable } from '../Lead/LeadTable'
export function Navigation() {
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/campaigns/create" element={<CampaignBlock />} />
      <Route
        path="/campaigns"
        element={
          selectedCampaign ? (
            <CampaignDetail
              campaign={selectedCampaign}
              onBack={() => {
                setSelectedCampaign(null)
                navigate('/campaigns')
              }}
            />
          ) : (
            <CampaignTable
              onCampaignSelect={setSelectedCampaign}
            />
          )
        }
      />
      <Route path="/leads/create" element={<LeadBlock />} />
      <Route path="/leads" element={<LeadTable />} />
    </Routes>
  )
}
