import React from 'react'
import { Container, Typography, Button, Box } from '@mui/material'
// import { createCard, loadCards, redeemCard, CardData } from './CardManager'
import { createCard, loadCards, CardData } from './CardManager'
// import Footer from './Utils/footer'

const App: React.FC = () => {
  // TODO: Implement the UI and logic for the Collectible Card Creator with fields: name, description, rarity, ability, history, sats:
  // 1. Create state variables for card attributes (name: string, description: string, rarity: string, ability: string, history: string, sats: number) and loading state.
  // 2. Implement a form with inputs for card attributes (e.g., text fields for name, description, ability, history; a dropdown for rarity with options like "common", "rare", "epic", "legendary"; a number input for sats).
  // 3. Add a "Create Card" button that calls createCard with the form data, validates inputs (e.g., non-empty name, description, rarity, ability; sats > 0), and refreshes the card list on success.
  // 4. Load cards on mount using loadCards and display them in a list or grid, showing attributes: name, description, rarity, ability, history, and sats.
  // 5. Add a "Redeem" button for each card that calls redeemCard and refreshes the list on success.
  // 6. Include loading indicators and user-friendly error messages (e.g., alerts or status text) for create and redeem operations.
  // 7. Style the UI with Material-UI in dark mode, ensuring responsiveness and accessibility.
  // 8. Customize the layout, add features (e.g., card images, filters, or trading), or enhance the design to make it your own.

  const [cards, setCards] = React.useState<CardData[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)

  React.useEffect(() => {
    async function fetchCards() {
      setLoading(true)
      const loadedCards = await loadCards()
      setCards(loadedCards)
      setLoading(false)
    }
    fetchCards()
  }, [])

  // For now, we will just load the cards and display a placeholder UI. You can replace this with your actual implementation of the card creator and list.

  const handleCreateCard = async () => {
    // Example of creating a card with hardcoded attributes. Replace with form data.
    const newCard: CardData = {
      name: 'Example Card',
      description: 'This is an example collectible card.',
      rarity: 'rare',
      ability: 'Example ability description.',
      history: 'Example card history.',
      sats: 1,
      txid: '',
      outputIndex: 0,
      outputScript: '',
      keyID: ''
    }
    try {
      await createCard(newCard)
      // Refresh the card list after creating a new card
      const loadedCards = await loadCards()
      setCards(loadedCards)
    } catch (err) {
      console.error('Error creating card:', err)
    }
  }

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Lab L-8: Collectible Card Creator
        </Typography>
        <Box sx={{ mt: 4 }}>
          {/* Your custom UI goes here */}
          <Typography>Implement your card creator UI here.</Typography>
        </Box>
      </Container>
      {/* <Footer /> */}
    </>
  )
}

export default App
