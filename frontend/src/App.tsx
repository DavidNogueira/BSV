import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material'
import { createCard, loadCards, redeemCard, CardData } from './CardManager'
// import Footer from './Utils/footer'

const App: React.FC = () => {
  // Form input states
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [rarity, setRarity] = useState<string>('common')
  const [ability, setAbility] = useState<string>('')
  const [history, setHistory] = useState<string>('')
  const [sats, setSats] = useState<number>(1)

  // Cards list state
  const [cards, setCards] = useState<CardData[]>([])

  // Loading states
  const [loading, setLoading] = useState<boolean>(true)
  const [creating, setCreating] = useState<boolean>(false)

  // Message states
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Function to load cards from blockchain
  const loadCardsData = async () => {
    try {
      setLoading(true)
      setErrorMessage('')
      const loadedCards = await loadCards()
      setCards(loadedCards)
    } catch (error) {
      console.error('Error loading cards:', error)
      setErrorMessage('Failed to load cards. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }
  // Load cards when component mounts
  useEffect(() => {
    loadCardsData()
  }, [])

  // Function to handle card creation
  const handleCreateCard = async () => {
    // Validation
    if (!name.trim()) {
      setErrorMessage('Card name is required')
      return
    }
    if (!description.trim()) {
      setErrorMessage('Card description is required')
      return
    }
    if (!ability.trim()) {
      setErrorMessage('Card ability is required')
      return
    }
    if (!history.trim()) {
      setErrorMessage('Card history is required')
      return
    }
    if (sats < 1) {
      setErrorMessage('Satoshis must be at least 1')
      return
    }

    try {
      setCreating(true)
      setErrorMessage('')
      setSuccessMessage('')

      // Create the card on blockchain
      await createCard({
        name: name.trim(),
        description: description.trim(),
        rarity,
        ability: ability.trim(),
        history: history.trim(),
        sats
      })

      // Clear form
      setName('')
      setDescription('')
      setRarity('common')
      setAbility('')
      setHistory('')
      setSats(1)

      // Reload cards to show new card
      await loadCardsData()

      setSuccessMessage('Card created successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error creating card:', error)
      setErrorMessage('Failed to create card. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  // Function to handle card redemption
  const handleRedeemCard = async (card: CardData) => {
    try {
      setErrorMessage('')
      setSuccessMessage('')

      // Confirm with user
      if (
        !confirm(
          `Are you sure you want to redeem "${card.name}"? This action cannot be undone.`
        )
      ) {
        return
      }

      // Redeem the card on blockchain
      await redeemCard(card)

      // Reload cards to remove redeemed card
      await loadCardsData()

      setSuccessMessage('Card redeemed successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error redeeming card:', error)
      setErrorMessage('Failed to redeem card. Please try again.')
    }
  }

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Lab L-8: Collectible Card Creator
        </Typography>
        {/* Success Message */}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {/* Card Creation Form */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Create New Card
          </Typography>

          <TextField
            label="Card Name"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="e.g., Dragon Slayer"
          />

          <TextField
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={2}
            placeholder="e.g., A fierce warrior with unmatched strength"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Rarity</InputLabel>
            <Select
              value={rarity}
              onChange={e => setRarity(e.target.value)}
              label="Rarity"
            >
              <MenuItem value="common">Common</MenuItem>
              <MenuItem value="rare">Rare</MenuItem>
              <MenuItem value="epic">Epic</MenuItem>
              <MenuItem value="legendary">Legendary</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Ability"
            value={ability}
            onChange={e => setAbility(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="e.g., Fire Blast: +10 damage"
          />

          <TextField
            label="History"
            value={history}
            onChange={e => setHistory(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={2}
            placeholder="e.g., Created on Jan 7, 2026. First card in collection."
            helperText="This is the first entry in the card's evolving history"
          />

          <TextField
            label="Satoshis"
            type="number"
            value={sats}
            onChange={e => setSats(Number(e.target.value))}
            fullWidth
            margin="normal"
            inputProps={{ min: 1 }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateCard}
            disabled={creating}
            fullWidth
            sx={{ mt: 2 }}
          >
            {creating ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Creating Card...
              </>
            ) : (
              'Create Card'
            )}
          </Button>
        </Box>

        {/* Card Display Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Your Cards
          </Typography>

          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : cards.length === 0 ? (
            /* Empty State */
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No cards yet. Create your first card above!
              </Typography>
            </Box>
          ) : (
            /* Cards Grid */
            <Grid container spacing={3}>
              {cards.map(card => (
                <Grid item xs={12} sm={6} md={4} key={card.txid}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {card.name}
                      </Typography>

                      <Chip
                        label={card.rarity}
                        size="small"
                        sx={{
                          mb: 2,
                          bgcolor:
                            card.rarity === 'legendary'
                              ? '#FFD700'
                              : card.rarity === 'epic'
                                ? '#9C27B0'
                                : card.rarity === 'rare'
                                  ? '#2196F3'
                                  : '#757575',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                      >
                        {card.description}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', mb: 0.5 }}
                      >
                        Ability:
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                      >
                        {card.ability}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', mb: 0.5 }}
                      >
                        History:
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                      >
                        {card.history}
                      </Typography>

                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Value: {card.sats} satoshis
                      </Typography>
                    </CardContent>

                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={() => handleRedeemCard(card)}
                      >
                        Redeem Card
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Container>
      {/* <Footer /> */}
    </>
  )
}

export default App
