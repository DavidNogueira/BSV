import { Box, Typography, Link } from '@mui/material'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        textAlign: 'center',
        borderTop: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Lab L-7: ToDo List Application with PushDrop
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Built with{' '}
        <Link
          href="https://docs.bsvblockchain.org/"
          target="_blank"
          rel="noopener"
        >
          BSV SDK
        </Link>{' '}
        and{' '}
        <Link href="https://react.dev/" target="_blank" rel="noopener">
          React
        </Link>
      </Typography>
    </Box>
  )
}
