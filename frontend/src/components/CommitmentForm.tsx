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
  TextField
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import React, { useState, FormEvent, ChangeEvent } from 'react'
import { publishCommitment } from '../utils/publishCommitment'
import { WalletClient } from '@bsv/sdk'

const wallet = new WalletClient()
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

  //~ DONE 1: Handle file input changes
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }
  //~ DONE 2: Handle form submission
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (formLoading) return // guard against re-entrant submits
    if (hostingTime < MIN_HOSTING_MINUTES) {
      console.error(`Invalid hosting time: must be at least ${MIN_HOSTING_MINUTES} minutes.`)
      return
    }
    setFormLoading(true)
    try {
      let urlToPublish = fileURL
      if (!useURL && file) {
        // If using file upload, create a temporary URL for the file
        urlToPublish = URL.createObjectURL(file)
      }
      const identityKey = await wallet.getPublicKey({ identityKey: true })

      const commitmentURL = await publishCommitment({
        url: urlToPublish,
        hostingMinutes: hostingTime,
        address: identityKey.publicKey,
        serviceURL: hostingURL,
        testWerrLabel: false
      })
      setCommittedURL(commitmentURL)
      console.log('Commitment published at:', commitmentURL)
    } catch (error) {
      console.error('Error publishing commitment:', error)
    } finally {
      setFormLoading(false)
      setFormOpen(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box mt={5} p={3} border={1} borderRadius={4} borderColor="grey.300">
        <Typography variant="h4" gutterBottom>
          Create File Storage Commitment
        </Typography>
        <Fab color="primary" onClick={() => setFormOpen(true)}>
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
        {/* // DONE 3: Display published UHRP URL */}
        {committedURL && (
          <Box mt={2}>
            <Typography variant="body1">
              Commitment published at: {committedURL}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  )
}

export default CommitmentForm
