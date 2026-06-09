import React, { FormEvent, useState, useEffect } from 'react'
import {
  Button,
  LinearProgress,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material'
import { CloudDownload } from '@mui/icons-material'
import { toast } from 'react-toastify'
import { StorageDownloader } from '@bsv/sdk/storage/StorageDownloader'

interface DownloadFormProps {}

type NetworkType = 'mainnet' | 'testnet' | 'local'

const DownloadForm: React.FC<DownloadFormProps> = () => {
  const [downloadURL, setDownloadURL] = useState<string>('')
  const [network, setNetwork] = useState<NetworkType>('mainnet')
  const [loading, setLoading] = useState<boolean>(false)
  const [inputsValid, setInputsValid] = useState<boolean>(false)

  // Simple form validation: must have a non-empty download URL
  useEffect(() => {
    setInputsValid(downloadURL.trim() !== '')
  }, [downloadURL])

  const handleDownload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    //~ DONE: Implement UI feedback for the download process with the following requirements:
    //~ - Before initiating the download, display a toast.info with the message "Initiating download..."
    //~ - Create a StorageDownloader instance with the selected networkPreset (network state)
    //~ - Use storageDownloader.download to download the file using the trimmed downloadURL
    //~ - Ensure data and mimeType are returned, throwing an error with the message "Error fetching file from [downloadURL]" if not
    //~ - Convert the data (number[]) to a Uint8Array, then create a Blob with the mimeType
    //~ - Create a URL for the Blob using URL.createObjectURL
    //~ - Programmatically trigger the file download by creating an <a> element, setting its href to the Blob URL, and its download attribute to the last part of the downloadURL or "downloaded_file" if not available
    //~ - Append the link to the document body, trigger a click, and clean up by removing the link and revoking the Blob URL
    //~ - On success, display a toast.success with the message "File downloaded successfully"
    //~ - Catch any errors, log them to the console, display a toast.error with "An error occurred during download", and rethrow the error
    //~ - In a finally block, set loading to false
    try {
      toast.info('Initiating download...')
      const storageDownloader = new StorageDownloader({
        networkPreset: network
      })
      const { data, mimeType } = await storageDownloader.download(
        downloadURL.trim()
      )
      if (!data || !mimeType) {
        throw new Error(`Error fetching file from ${downloadURL}`)
      }
      const uint8Array = new Uint8Array(data)
      const blob = new Blob([uint8Array], { type: mimeType })
      const blobURL = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobURL
      link.download = downloadURL.split('/').pop() || 'downloaded_file'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobURL)

      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('An error occurred during download')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleDownload}>
      <Grid container spacing={3} sx={{ py: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
            Download Form
          </Typography>
          <Typography color="textSecondary" paragraph sx={{ mb: 3 }}>
            Download files from UHRP Storage
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            label="UHRP URL"
            placeholder="Enter UHRP URL to download"
            value={downloadURL}
            onChange={e => setDownloadURL(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
            <InputLabel id="network-select-label">Network</InputLabel>
            <Select
              labelId="network-select-label"
              value={network}
              label="Network"
              onChange={(e: SelectChangeEvent<string>) => {
                setNetwork(e.target.value as NetworkType)
              }}
            >
              <MenuItem value="mainnet">Mainnet</MenuItem>
              <MenuItem value="testnet">Testnet</MenuItem>
              <MenuItem value="local">Local</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid
          item
          xs={12}
          sx={{ display: 'flex', justifyContent: 'flex-start' }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={loading || !inputsValid}
            startIcon={<CloudDownload />}
            sx={{ borderRadius: 2, px: 3, py: 1 }}
          >
            Download
          </Button>
        </Grid>

        {loading && (
          <Grid item xs={12} sx={{ mt: 2 }}>
            <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
          </Grid>
        )}
      </Grid>
    </form>
  )
}

export default DownloadForm
