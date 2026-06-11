import React from 'react'
import { Box, Link, Typography } from '@mui/material'

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme => theme.palette.background.paper,
        textAlign: 'center'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Powered by{' '}
        <Link
          href="https://github.com/bitcoin-sv/ts-sdk"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
        >
          Bitcoin SV SDK
        </Link>
        {' | '}
        <Link
          href="https://projectbabbage.com"
          target="_blank"
          rel="noopener noreferrer"
          color="primary"
        >
          Project Babbage
        </Link>
      </Typography>
    </Box>
  )
}

export default Footer
