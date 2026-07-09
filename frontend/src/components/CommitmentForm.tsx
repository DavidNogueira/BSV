import {
  Fab,
  DialogActions,
  Container,
  Typography,
  Box,
  Grid,
  Dialog,
  DialogContent,
  DialogContentText,
  LinearProgress,
  Button,
  TextField,
  Alert
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import React, { useState, FormEvent, ChangeEvent } from 'react'
import { publishCommitment } from '../utils/publishCommitment'
import { WalletClient, StorageDownloader } from '@bsv/sdk'

const MIN_HOSTING_MINUTES = 15

const CommitmentForm = () => {
  const [file, setFile] = useState<File | null>(null)
  const [fileURL, setFileURL] = useState<string>('')
  const [hostingTime, setHostingTime] = useState<number>(MIN_HOSTING_MINUTES)
  const [formOpen, setFormOpen] = useState<boolean>(false)
  const [formLoading, setFormLoading] = useState<boolean>(false)
  const [useURL, setUseURL] = useState<boolean>(false)
  const hostingURL = 'https://nanostore.babbage.systems'
  const [committedURL, setCommittedURL] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewLoading, setViewLoading] = useState<boolean>(false)

  // TODO 1: Handle file input changes

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null
    setFile(selectedFile)
  }

  // TODO 2: Handle form submission
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setErrorMessage(null)
    try {
      const url = useURL
        ? fileURL
        : file !== null
          ? URL.createObjectURL(file)
          : ''
      if (hostingTime < MIN_HOSTING_MINUTES) {
        throw new Error(`Hosting time must be at least ${MIN_HOSTING_MINUTES} minutes.`)
      }
      const walletClient = new WalletClient()
      const { publicKey: address } = await walletClient.getPublicKey({
        identityKey: true
      })
      const uhrpURL = await publishCommitment({
        url,
        hostingMinutes: hostingTime,
        address,
        serviceURL: hostingURL,
        testWerrLabel: false
      })
      setCommittedURL(uhrpURL)
      setFormOpen(false)
    } catch (error) {
      console.error('Error creating commitment:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to create the file storage commitment. Please try again.'
      )
    } finally {
      setFormLoading(false)
    }
  }

  const handleViewFile = async () => {
    if (committedURL === null) return
    setViewLoading(true)
    setErrorMessage(null)
    // Open the tab synchronously, in direct response to the click, so browsers
    // don't treat it as a popup once the async resolution below completes --
    // otherwise `window.open` would silently be blocked with no error to catch.
    const newWindow = window.open('', '_blank')
    try {
      const downloader = new StorageDownloader()
      const httpUrls = await downloader.resolve(committedURL)
      if (httpUrls.length === 0) {
        throw new Error('No host is currently serving this file yet.')
      }
      if (newWindow === null) {
        throw new Error('Your browser blocked the popup. Please allow popups for this site and try again.')
      }
      newWindow.location.href = httpUrls[0]
    } catch (error) {
      newWindow?.close()
      console.error('Error resolving file:', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to resolve the file for viewing. Please try again.'
      )
    } finally {
      setViewLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box mt={5} p={3} border={1} borderRadius={4} borderColor="grey.300">
        <Typography variant="h4" gutterBottom>
          Create File Storage Commitment
        </Typography>
        <Fab
          color="primary"
          onClick={() => {
            setErrorMessage(null)
            setFormOpen(true)
          }}
        >
          <AddIcon />
        </Fab>
        <Grid>
          <Dialog open={formOpen} onClose={() => setFormOpen(false)}>
            <form onSubmit={handleFormSubmit}>
              <DialogContent>
                <DialogContentText paragraph>
                  {useURL
                    ? 'Enter the URL of the file and specify the hosting time.'
                    : 'Upload a file and specify the hosting time to create a file storage commitment.'}
                </DialogContentText>
                <Button
                  variant="outlined"
                  onClick={() => setUseURL(!useURL)}
                  style={{ marginBottom: '16px' }}
                >
                  {useURL ? 'Switch to File Upload' : 'Switch to URL Input'}
                </Button>
                {useURL ? (
                  <TextField
                    label="File URL"
                    fullWidth
                    margin="normal"
                    onChange={e => setFileURL(e.target.value)}
                    value={fileURL}
                    required
                  />
                ) : (
                  <input
                    type="file"
                    onChange={handleFileChange}
                    required
                    style={{ display: 'block', marginBottom: '16px' }}
                  />
                )}
                <TextField
                  label="Hosting Time (minutes)"
                  type="number"
                  fullWidth
                  margin="normal"
                  onChange={e => setHostingTime(Number(e.target.value))}
                  value={hostingTime}
                  inputProps={{ min: MIN_HOSTING_MINUTES }}
                  helperText={`Minimum ${MIN_HOSTING_MINUTES} minutes`}
                  required
                />
                {errorMessage !== null && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {errorMessage}
                  </Alert>
                )}
              </DialogContent>
              {formLoading ? (
                <LinearProgress />
              ) : (
                <DialogActions>
                  <Button onClick={() => setFormOpen(false)}>Cancel</Button>
                  <Button type="submit" color="primary">
                    Submit
                  </Button>
                </DialogActions>
              )}
            </form>
          </Dialog>
        </Grid>
        {/* TODO 3: Display published UHRP URL */}
        {committedURL !== null && (
          <Box mt={2}>
            <Typography variant="body1" style={{ wordBreak: 'break-all' }}>
              Published UHRP URL: {committedURL}
            </Typography>
            <Button
              variant="outlined"
              onClick={handleViewFile}
              disabled={viewLoading}
              style={{ marginTop: '8px' }}
            >
              {viewLoading ? 'Resolving...' : 'View File'}
            </Button>
          </Box>
        )}
        {errorMessage !== null && !formOpen && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
      </Box>
    </Container>
  )
}

export default CommitmentForm
