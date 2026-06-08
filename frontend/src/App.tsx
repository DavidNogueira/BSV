// import React, { useEffect, useState } from 'react'
// let hasComponentRemount = false

// export default function App() {
//   const [identityKey, setIdentityKey] = useState<string | null>(null)

//   useEffect(() => {
//     //? We use a flag (hasComponentRemount) to ensure that the transaction creation function is only called once when the app starts. This prevents multiple transactions from being created if the component re-renders for any reason, which is important for debugging and ensuring that we don't create unintended transactions.
//     if (hasComponentRemount) return
//     hasComponentRemount = true

//     const init = async () => {
//       try {
//         await initializeClient()
//         const key = await getMyIdentityKey()
//         setIdentityKey(key)
//       } catch (err) {
//         console.error('Initialization error:', err)
//       }
//     }
//     init()
//   }, [])

//   return <div>Whatever code</div>
// }

import React, { useState } from 'react'
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  Box,
  CircularProgress
} from '@mui/material'
import { ToastContainer } from 'react-toastify'
import useAsyncEffect from 'use-async-effect'
import checkForMetaNetClient from './utils/checkForMetaNetClient.js'
import NoMncModal from './components/NoMncModal/NoMncModal.js'
import DownloadForm from './components/DownloadForm.js'
import UploadForm from './components/UploadForm.js'
import FilesForm from './components/FilesForm.js'
import Footer from './components/Footer.js'

import './App.scss'

const App: React.FC = () => {
  const [tabIndex, setTabIndex] = useState<number>(0)
  const [isMncMissing, setIsMncMissing] = useState<boolean>(false)
  const [isCheckingMnc, setIsCheckingMnc] = useState<boolean>(true)

  // Run a 1s interval for checking if MNC is running
  useAsyncEffect(async () => {
    const intervalId = setInterval(async () => {
      const hasMNC = await checkForMetaNetClient()
      if (hasMNC === 0) {
        setIsMncMissing(true) // Open modal if MNC is not found
        setIsCheckingMnc(false)
      } else {
        clearInterval(intervalId)
        setIsMncMissing(false) // Ensure modal is closed if MNC is found
        setIsCheckingMnc(false)
      }
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabIndex(newValue)
  }

  return (
    // TODO: Add a loading indicator while checking for the Metanet client:
    // - If isCheckingMnc is true, render a <Box> with display="flex", flexDirection="column", alignItems="center", and justifyContent="center"
    // - Inside the Box, include a <CircularProgress> with size={40} and sx={{ mb: 2 }}
    // - Include a <Typography> with variant="body1" and the text "Checking for Metanet client..."
    // - Otherwise, render the full UI below
    <Container maxWidth="md" sx={{ paddingTop: '2em', paddingBottom: '2em' }}>
      <NoMncModal open={isMncMissing} onClose={() => setIsMncMissing(false)} />
      <Grid container spacing={2}>
        <Grid item xs={12} sx={{ mb: 2 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{ fontWeight: 'bold', mb: 1 }}
          >
            UHRP Storage UI
          </Typography>
          <Typography
            color="textSecondary"
            paragraph
            align="center"
            sx={{ mb: 3 }}
          >
            Upload and Download Content
          </Typography>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                borderRadius: '4px 4px 0 0',
                fontWeight: 'medium',
                py: 1.5
              }
            }}
          >
            <Tab label="Download" />
            <Tab label="Upload" />
            <Tab label="Files" />
          </Tabs>
        </Grid>
        <Grid item xs={12}>
          <div style={{ minHeight: '400px' }}>
            {tabIndex === 0 && <DownloadForm />}
            {tabIndex === 1 && <UploadForm />}
            {tabIndex === 2 && <FilesForm />}
          </div>
        </Grid>
        <Grid item xs={12}>
          <Footer />
        </Grid>
      </Grid>
    </Container>
  )
}

export default App
