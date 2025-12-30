import { useEffect, useState } from 'react'
import { MantineProvider, Center, Stack, Box, Group, Card, Text, Skeleton, Button, List, Popover, Modal, Grid } from '@mantine/core'
import type { Carta, Suit, Rank, Player, CartaGiocata } from './game/model/Card'
import { IconCircleCheck, IconClubsFilled, IconDiamondFilled, IconHeartFilled, IconQuestionMark, IconSpadeFilled, IconXboxX } from '@tabler/icons-react'
import './App.css'
import { useDisclosure } from '@mantine/hooks'

/* ------------------ UTIL ------------------ */

const suits: Suit[] = ['Cuori', "Fiori", 'Quadri', 'Picche']
const ranks: Rank[] = ['7', '8', '9', 'J', 'Q', 'K', '10', 'A']
const rankOrderDesc: Rank[] = [...ranks].reverse()

function sortHand(hand: Carta[]): Carta[] {
  return [...hand].sort((a, b) => {
    const suitDiff = suits.indexOf(a.suit) - suits.indexOf(b.suit)
    if (suitDiff !== 0) return suitDiff
    return rankOrderDesc.indexOf(a.value as Rank) - rankOrderDesc.indexOf(b.value as Rank)
  })
}

function createDeck(): Carta[] {
  return suits.flatMap((s) =>
    ranks.map((r) => ({ suit: s, value: r }))
  )
}

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5)
}

/* ------------------ APP ------------------ */

export default function App() {
  const [deck, setDeck] = useState<Carta[]>(createDeck())
  const [playerHand, setPlayerHand] = useState<Carta[]>([])
  const [enemy1Hand, setEnemy1Hand] = useState<Carta[]>([])
  const [partnerHand, setPartnerHand] = useState<Carta[]>([])
  const [enemy2Hand, setEnemy2Hand] = useState<Carta[]>([])
  const [cardOut, setCardOut] = useState<Carta | null>(null)
  const [phase, setPhase] = useState<"pick" | "play" | "second">("pick")
  const players = ["Giocatore", "Nemico 1", "Compagno", "Nemico 2"] as const
  const [turn, setTurn] = useState<Player>("Giocatore")
  const [startingPlayer, setStartingPlayer] = useState<Player>("Giocatore")
  const [log, setLog] = useState<string[]>([])
  const [passes, setPasses] = useState<number>(0)
  const [secondPasses, setSecondPasses] = useState<number>(0)
  const [seme, setSeme] = useState<Suit | "Senza" | null>(null)
  const [haMandato, setHaMandato] = useState<"Giocatore" | "Avversari" | null>(null)
  const [inCampo, setInCampo] = useState<CartaGiocata[]>([])
  const [preseGiocatore, setPreseGiocatore] = useState<CartaGiocata[]>([])
  const [preseAvversari, setPreseAvversari] = useState<CartaGiocata[]>([])
  const [gameOver, { open: openGameOver, close: closeGameOver }] = useDisclosure(false)
  const [puntiGiocatoreFinali, setPuntiGiocatoreFinali] = useState<number>(0)
  const [puntiAvversariFinali, setPuntiAvversariFinali] = useState<number>(0)

  useEffect(() => {
    resetGame()
  }, [])

  const resetGame = () => {
    let d = shuffle(createDeck());
    setDeck(d);
    let p1: Carta[] = [];
    let e1: Carta[] = [];
    let p2: Carta[] = [];
    let e2: Carta[] = [];
    for (let i = 0; i < 3; i++) {
      p1.push(d.pop()!);
      e1.push(d.pop()!);
      p2.push(d.pop()!);
      e2.push(d.pop()!);
    }
    for (let i = 0; i < 2; i++) {
      p1.push(d.pop()!);
      e1.push(d.pop()!);
      p2.push(d.pop()!);
      e2.push(d.pop()!);
    }
    setPlayerHand(sortHand(p1));
    setEnemy1Hand(sortHand(e1));
    setPartnerHand(sortHand(p2));
    setEnemy2Hand(sortHand(e2));
    setCardOut(d.pop()!);
    let currentPlayer = players[Math.floor(Math.random() * players.length)];
    setTurn(currentPlayer);
    setStartingPlayer(currentPlayer);
    let newLog = [`Nuova partita iniziata. Inizia ${currentPlayer}.`];
    setLog(newLog);
    setPhase("pick");
    setPasses(0);
    setSecondPasses(0);
    setSeme(null);
    setHaMandato(null);
    setInCampo([]);
    setPreseGiocatore([]);
    setPreseAvversari([]);
    setPuntiAvversariFinali(0)
    setPuntiGiocatoreFinali(0)
  }

  const getNextPlayer = (currentPlayer: typeof turn): typeof turn => {
    let currentIndex = players.indexOf(currentPlayer)
    let nextIndex = (currentIndex + 1) % players.length
    return players[nextIndex]
  }

  const handlePass = () => {
    let nextPlayer = getNextPlayer(turn)
    setTurn(nextPlayer)
    setPasses(passes + 1)
    if (passes < 3) setLog(prevLog => [...prevLog, `${turn} ha passato. Ora sceglie ${nextPlayer}.`])
    else {
      setLog(prevLog => [...prevLog, `Tutti hanno passato. Si va al secondo giro di chiamate.`])
      setPhase("second")
    }
  }

  const handleSecondPass = () => {
    let nextPlayer = getNextPlayer(turn)
    setTurn(nextPlayer)
    setSecondPasses(secondPasses + 1)
    if (secondPasses < 3) setLog(prevLog => [...prevLog, `${turn} ha passato. Ora sceglie ${nextPlayer}.`])
    else {
      setLog(prevLog => [...prevLog, `Tutti hanno passato di nuovo. La mano viene annullata.`])
      resetGame()
    }
  }

  const handleAccept = (player: typeof turn, suit: Suit | "Senza") => {
    setLog([...log, `${player} manda a ${suit}.`])
    let p1Hand = playerHand
    let e1Hand = enemy1Hand
    let p2Hand = partnerHand
    let e2Hand = enemy2Hand
    switch (player) {
      case "Giocatore":
        p1Hand.push(cardOut!)
        break
      case "Nemico 1":
        e1Hand.push(cardOut!)
        break
      case "Compagno":
        p2Hand.push(cardOut!)
        break
      case "Nemico 2":
        e2Hand.push(cardOut!)
        break
    }
    switch (startingPlayer) {
      case "Giocatore":
        p1Hand.push(deck.pop()!)
        p1Hand.push(deck.pop()!)
        if (player !== "Giocatore") p1Hand.push(deck.pop()!)
        e1Hand.push(deck.pop()!)
        e1Hand.push(deck.pop()!)
        if (player !== "Nemico 1") e1Hand.push(deck.pop()!)
        p2Hand.push(deck.pop()!)
        p2Hand.push(deck.pop()!)
        if (player !== "Compagno") p2Hand.push(deck.pop()!)
        e2Hand.push(deck.pop()!)
        e2Hand.push(deck.pop()!)
        if (player !== "Nemico 2") e2Hand.push(deck.pop()!)
        break
      case "Nemico 1":
        e1Hand.push(deck.pop()!)
        e1Hand.push(deck.pop()!)
        if (player !== "Nemico 1") e1Hand.push(deck.pop()!)
        p2Hand.push(deck.pop()!)
        p2Hand.push(deck.pop()!)
        if (player !== "Compagno") p2Hand.push(deck.pop()!)
        e2Hand.push(deck.pop()!)
        e2Hand.push(deck.pop()!)
        if (player !== "Nemico 2") e2Hand.push(deck.pop()!)
        p1Hand.push(deck.pop()!)
        p1Hand.push(deck.pop()!)
        if (player !== "Giocatore") p1Hand.push(deck.pop()!)
        break
      case "Compagno":
        p2Hand.push(deck.pop()!)
        p2Hand.push(deck.pop()!)
        if (player !== "Compagno") p2Hand.push(deck.pop()!)
        e2Hand.push(deck.pop()!)
        e2Hand.push(deck.pop()!)
        if (player !== "Nemico 2") e2Hand.push(deck.pop()!)
        p1Hand.push(deck.pop()!)
        p1Hand.push(deck.pop()!)
        if (player !== "Giocatore") p1Hand.push(deck.pop()!)
        e1Hand.push(deck.pop()!)
        e1Hand.push(deck.pop()!)
        if (player !== "Nemico 1") e1Hand.push(deck.pop()!)
        break
      case "Nemico 2":
        e2Hand.push(deck.pop()!)
        e2Hand.push(deck.pop()!)
        if (player !== "Nemico 2") e2Hand.push(deck.pop()!)
        p1Hand.push(deck.pop()!)
        p1Hand.push(deck.pop()!)
        if (player !== "Giocatore") p1Hand.push(deck.pop()!)
        e1Hand.push(deck.pop()!)
        e1Hand.push(deck.pop()!)
        if (player !== "Nemico 1") e1Hand.push(deck.pop()!)
        p2Hand.push(deck.pop()!)
        p2Hand.push(deck.pop()!)
        if (player !== "Compagno") p2Hand.push(deck.pop()!)
        break
    }
    setPlayerHand(sortHand(p1Hand))
    setEnemy1Hand(sortHand(e1Hand))
    setPartnerHand(sortHand(p2Hand))
    setEnemy2Hand(sortHand(e2Hand))
    setPhase("play")
    setTurn(startingPlayer)
    setLog(prevLog => [...prevLog, `Il mazzo è stato distribuito. Inizia ${startingPlayer}.`])
    setHaMandato(player === "Giocatore" || player === "Compagno" ? "Giocatore" : "Avversari")
    setSeme(suit)
  }

  const aiMandaDecisione = (player: typeof turn) => {
    const accept = Math.random() < 0.5
    if (accept) {
      handleAccept(player, cardOut!.suit)
    } else {
      handlePass()
    }
  }

  const aiSecondaDecisione = (player: typeof turn) => {
    const accept = Math.random()
    let otherSuits = suits.filter(s => s !== cardOut!.suit)
    if (accept < 0.2) {
      handleSecondPass()
    } else if (accept < 0.4) {
      handleAccept(player, otherSuits[0])
    } else if (accept < 0.6) {
      handleAccept(player, otherSuits[1])
    } else if (accept < 0.8) {
      handleAccept(player, otherSuits[2])
    } else {
      handleAccept(player, "Senza")
    }
  }

  const aiScegliePrimaCarta = (player: Player) => {
    let hand: Carta[] = player === "Nemico 1" ? enemy1Hand :
      player === "Compagno" ? partnerHand :
        enemy2Hand
    let cardToPlay = hand[Math.floor(Math.random() * hand.length)]
    playCard(player, cardToPlay)
  }

  const playCard = (player: Player, card: Carta) => {
    if (phase !== "play") return
    let hand: Carta[] = player === "Giocatore" ? playerHand :
      player === "Nemico 1" ? enemy1Hand :
        player === "Compagno" ? partnerHand :
          enemy2Hand
    hand = hand.filter(c => !(c.suit === card.suit && c.value === card.value))
    switch (player) {
      case "Giocatore":
        setPlayerHand(hand)
        break
      case "Nemico 1":
        setEnemy1Hand(hand)
        break
      case "Compagno":
        setPartnerHand(hand)
        break
      case "Nemico 2":
        setEnemy2Hand(hand)
        break
    }
    const playedCard: CartaGiocata = { ...card, player }
    setInCampo([...inCampo, playedCard])
    setLog([...log, `${player} ha giocato ${card.value} di ${card.suit}.`])
    if (inCampo.length < 3) {
      let nextPlayer = getNextPlayer(player)
      setTurn(nextPlayer)
      setLog(prevLog => [...prevLog, `Ora tocca a ${nextPlayer}.`])
    }
    else {
      let manoCompleta = [...inCampo, playedCard]
      let semeDominante = manoCompleta[0].suit
      const carteDelSemeDiBriscola = manoCompleta.filter(c => c.suit === seme)
      if (carteDelSemeDiBriscola.length > 0 && seme !== null && seme !== "Senza") {
        semeDominante = seme
      }
      const carteDelSemeDominante = manoCompleta.filter(c => c.suit === semeDominante)
      let cartaVincente = carteDelSemeDominante.reduce((max, card) => {
        return rankOrderDesc.indexOf(card.value as Rank) < rankOrderDesc.indexOf(max.value as Rank) ? card : max
      })
      let vincitore = cartaVincente.player
      setLog(prevLog => [...prevLog, `${vincitore} vince la mano con ${cartaVincente.value} di ${cartaVincente.suit}.`])
      if (vincitore === "Giocatore" || vincitore === "Compagno") {
        setPreseGiocatore(prev => [...prev, ...manoCompleta])
      } else {
        setPreseAvversari(prev => [...prev, ...manoCompleta])
      }
      if (preseAvversari.length + preseGiocatore.length === 28) {
        finePartita(vincitore, manoCompleta)
      } else {
        setTurn(vincitore)
        setLog(prevLog => [...prevLog, `Inizia la prossima mano ${vincitore}.`])
        setInCampo([])
      }
    }
  }

  const finePartita = (vincitore: Player, ultimaMano: CartaGiocata[]) => {
    console.log("Partita finita!")
    console.log(preseGiocatore)
    console.log(preseAvversari)
    const calcolaPunti = (cartePrese: CartaGiocata[]) => {
      let totale = 0
      for (let card of cartePrese) {
        if (card.value === 'A') totale += 11
        else if (card.value === '10') totale += 10
        else if (card.value === 'K') totale += 4
        else if (card.value === 'Q') totale += 3
        else if (card.value === 'J' && card.suit !== seme) totale += 2
        else if (card.value === 'J' && card.suit === seme) totale += 20
        else if (card.value === '9' && card.suit === seme) totale += 14
      }
      return totale
    }
    let puntiGiocatore = calcolaPunti(preseGiocatore) + (vincitore === "Giocatore" || vincitore === "Compagno" ? (10 + calcolaPunti(ultimaMano)) : 0)
    let puntiAvversari = calcolaPunti(preseAvversari) + (vincitore === "Nemico 1" || vincitore === "Nemico 2" ? (10 + calcolaPunti(ultimaMano)) : 0)
    setPuntiGiocatoreFinali(puntiGiocatore)
    setPuntiAvversariFinali(puntiAvversari)
    openGameOver()
  }

  const aiRispondeCarta = (player: Player) => {
    let hand: Carta[] = player === "Nemico 1" ? enemy1Hand :
      player === "Compagno" ? partnerHand :
        enemy2Hand
    let playableCards = hand.filter(c => cartaGiocabile(c))
    let cardToPlay = playableCards[Math.floor(Math.random() * playableCards.length)]
    if (!cardToPlay) cardToPlay = hand[0]
    playCard(player, cardToPlay)
  }

  const cartaGiocabile = (card: Carta) => {
    if (inCampo.length > 0) {
      let semeDominante = inCampo[0].suit
      if (card.suit === semeDominante) { return true }
      let hasSemeDominante = playerHand.some(c => c.suit === semeDominante)
      if (hasSemeDominante && card.suit !== semeDominante) return false
      if (card.suit === seme) return true
      let hasSeme = playerHand.some(c => c.suit === seme)
      if (hasSeme && card.suit !== seme) return false
      else if (!hasSeme) return true
      return false
    }
    return true
  }

  useEffect(() => {
    if (turn === "Giocatore") return
    if (phase === "pick" && passes > 3) return
    if (phase === "pick") {
      const timer = setTimeout(() => {
        aiMandaDecisione(turn)
      }, 3000)
      return () => clearTimeout(timer)
    }
    if (phase === "second" && secondPasses > 3) return
    if (phase === "second") {
      const timer = setTimeout(() => {
        aiSecondaDecisione(turn)
      }, 3000)
      return () => clearTimeout(timer)
    }
    if (phase === "play") {
      const timer = setTimeout(() => {
        console.log(inCampo)
        if (inCampo.length === 0) {
          aiScegliePrimaCarta(turn)
        } else if (inCampo.length < 4) {
          aiRispondeCarta(turn)
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [turn, phase, inCampo])

  const getBoxStyle = (player: Player, isMobile: boolean): React.CSSProperties => {
    const baseStyle = {
      ...containerWithBorderStyle,
      borderColor: turn === player ? "#FFD700" : "rgba(255, 255, 255, 0.3)",
      boxShadow: turn === player ? '0 0 15px rgba(255, 215, 0, 0.5)' : 'none',
    }

    if (isMobile) {
      return {
        ...baseStyle,
        padding: '8px',
        marginBottom: '12px',
      }
    }

    return baseStyle
  }

  const tavoloStyle: React.CSSProperties = {
    width: '100vw',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px',
    boxSizing: 'border-box',
  }

  const containerWithBorderStyle: React.CSSProperties = {
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    padding: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }

  const getGridLayout = (isMobile: boolean): React.CSSProperties => {
    if (isMobile) {
      return {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '100%',
      }
    }

    return {
      display: 'grid',
      gridTemplateAreas: `
      ". north ."
      "west center east"
      ". south ."
    `,
      gap: '16px',
    }
  }

  const getEnemyGridColumns = (isMobile: boolean): React.CSSProperties => {
    if (isMobile) {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 1fr))',
        gap: '6px',
        justifyItems: 'center',
        alignItems: 'center',
      }
    }

    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, auto)',
      gridAutoRows: 'auto',
      rowGap: 8,
      columnGap: 8,
      justifyItems: 'center',
      alignItems: 'center',
    }
  }

  const getCardStyle = (isMobile: boolean): React.CSSProperties => {
    if (isMobile) {
      return {
        backgroundColor: 'cyan',
        padding: '6px',
        minWidth: '50px',
        minHeight: '70px',
      }
    }
    return { backgroundColor: 'cyan' }
  }

  /* ------------------ RENDER ------------------ */

  /* ------------------ RENDER ------------------ */

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <MantineProvider>
      <Center>
        <div style={tavoloStyle}>
          <Skeleton visible={cardOut === null}>
            {!isMobile ? (
              /* DESKTOP LAYOUT */
              <Box style={getGridLayout(isMobile)}>
                {/* NORTH - Compagno */}
                <Box style={{ gridArea: 'north', ...getBoxStyle("Compagno", isMobile) }}>
                  <Group justify='center' style={{ flexDirection: 'row' }}>
                    {partnerHand.map((card) => (
                      <Card key={`${card.suit}-${card.value}`} shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: "cyan" }}>
                        <Group style={{ flexDirection: "column" }}>
                          <IconQuestionMark size={32} />
                        </Group>
                      </Card>
                    ))}
                  </Group>
                </Box>

                {/* EAST - Nemico 1 */}
                <Box style={{ gridArea: 'east', ...getBoxStyle("Nemico 1", isMobile) }}>
                  <div style={getEnemyGridColumns(isMobile)}>
                    {enemy1Hand.map((card) => (
                      <Card key={`${card.suit}-${card.value}`} shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: "cyan" }}>
                        <Group style={{ flexDirection: "column" }}>
                          <IconQuestionMark size={32} />
                        </Group>
                      </Card>
                    ))}
                  </div>
                </Box>

                {/* CENTER */}
                {cardOut !== null && <Center style={{ gridArea: 'center' }}>
                  <Stack align="center" justify="center">
                    <Group justify="center" align="center">
                      <Stack>
                        {phase === "play" && seme !== null && <Text size="lg" w={300}>Si gioca a: {seme}</Text>}
                        {phase === "play" && haMandato !== null && <Text size="lg" w={300}>{haMandato === "Giocatore" ? "Ha mandato la tua squadra" : "Ha mandato la squadra avversaria"}</Text>}
                        {phase === "play" && <Text size="lg" w={300}>Turno di: {turn}</Text>}
                        <Popover width={500} position="left" withArrow shadow="md">
                          <Popover.Target>
                            <Button variant="light" color="blue">Mostra Log</Button>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <List style={{ maxHeight: "70vh", overflowY: "auto" }}>
                              {log.map((entry, index) => (
                                <List.Item key={index}>
                                  <Text size="sm">{entry}</Text>
                                </List.Item>
                              ))}
                            </List>
                          </Popover.Dropdown>
                        </Popover>
                      </Stack>

                      {phase !== "play" && <Card key={`${cardOut!.suit}-${cardOut!.value}`} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group style={{ flexDirection: "column" }}>
                          <Text style={{ color: cardOut!.suit === "Cuori" || cardOut!.suit === "Quadri" ? "red" : "black" }}>{cardOut!.value}</Text>
                          {cardOut!.suit === "Cuori" && <IconHeartFilled size={32} style={{ color: "red" }} />}
                          {cardOut!.suit === "Quadri" && <IconDiamondFilled size={32} style={{ color: "red" }} />}
                          {cardOut!.suit === "Fiori" && <IconClubsFilled size={32} style={{ color: "black" }} />}
                          {cardOut!.suit === "Picche" && <IconSpadeFilled size={32} style={{ color: "black" }} />}
                        </Group>
                      </Card>}
                    </Group>
                    {turn === "Giocatore" && <>
                      {phase === "pick" && <>
                        <Group justify="center">
                          <Button leftSection={<IconXboxX size={32} />} variant="light" color="red" onClick={() => handlePass()}>Via</Button>
                          <Button leftSection={<IconCircleCheck size={32} />} variant="light" color="green" onClick={() => handleAccept(turn, cardOut!.suit)}>Mando</Button>
                        </Group>
                      </>}
                      {phase === "second" && <>
                        <Group justify="center" wrap="wrap" gap="xs">
                          <Button leftSection={<IconXboxX size={32} />} variant="light" color="red" onClick={() => handleSecondPass()}>Due</Button>
                          {cardOut.suit !== "Cuori" && <Button leftSection={<IconHeartFilled size={32} />} variant="light" color="green" onClick={() => handleAccept("Giocatore", "Cuori")}>Cuori</Button>}
                          {cardOut.suit !== "Quadri" && <Button leftSection={<IconDiamondFilled size={32} />} variant="light" color="green" onClick={() => handleAccept("Giocatore", "Quadri")}>Quadri</Button>}
                          {cardOut.suit !== "Fiori" && <Button leftSection={<IconClubsFilled size={32} />} variant="light" color="green" onClick={() => handleAccept("Giocatore", "Fiori")}>Fiori</Button>}
                          {cardOut.suit !== "Picche" && <Button leftSection={<IconSpadeFilled size={32} />} variant="light" color="green" onClick={() => handleAccept("Giocatore", "Picche")}>Picche</Button>}
                          <Button variant="light" color="blue" onClick={() => handleAccept("Giocatore", "Senza")}>Senza</Button>
                        </Group>
                      </>}
                    </>}
                    {phase === "play" && inCampo.length > 0 && <>
                      <Group justify='center' style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {inCampo.map((card) => (
                          <Card key={`${card.suit}-${card.value}`} shadow="sm" padding="lg" radius="md" withBorder>
                            <Group style={{ flexDirection: "column" }}>
                              <Text style={{ color: card.suit === "Cuori" || card.suit === "Quadri" ? "red" : "black" }}>{card.value}</Text>
                              {card.suit === "Cuori" && <IconHeartFilled size={32} style={{ color: "red" }} />}
                              {card.suit === "Quadri" && <IconDiamondFilled size={32} style={{ color: "red" }} />}
                              {card.suit === "Fiori" && <IconClubsFilled size={32} style={{ color: "black" }} />}
                              {card.suit === "Picche" && <IconSpadeFilled size={32} style={{ color: "black" }} />}
                            </Group>
                          </Card>
                        ))}
                      </Group>
                    </>}
                  </Stack>
                </Center>}

                {/* WEST - Nemico 2 */}
                <Box style={{ gridArea: 'west', ...getBoxStyle("Nemico 2", isMobile) }}>
                  <div style={getEnemyGridColumns(isMobile)}>
                    {enemy2Hand.map((card) => (
                      <Card key={`${card.suit}-${card.value}`} shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: "cyan" }}>
                        <Group style={{ flexDirection: "column" }}>
                          <IconQuestionMark size={32} />
                        </Group>
                      </Card>
                    ))}
                  </div>
                </Box>

                {/* SOUTH - Giocatore */}
                <Box style={{ gridArea: 'south', ...getBoxStyle("Giocatore", isMobile) }}>
                  <Group justify='center' style={{ flexDirection: 'row' }}>
                    {playerHand.map((card) => {
                      const isPlayable = phase === "play" && turn === "Giocatore" && cartaGiocabile(card)
                      return (
                        <Card onClick={() => playCard("Giocatore", card)} key={`${card.suit}-${card.value}`} shadow="sm" padding="lg" radius="md" withBorder className={isPlayable ? 'card-clickable' : undefined}>
                          <Group style={{ flexDirection: "column" }}>
                            <Text style={{ color: card.suit === "Cuori" || card.suit === "Quadri" ? "red" : "black" }}>{card.value}</Text>
                            {card.suit === "Cuori" && <IconHeartFilled size={32} style={{ color: "red" }} />}
                            {card.suit === "Quadri" && <IconDiamondFilled size={32} style={{ color: "red" }} />}
                            {card.suit === "Fiori" && <IconClubsFilled size={32} style={{ color: "black" }} />}
                            {card.suit === "Picche" && <IconSpadeFilled size={32} style={{ color: "black" }} />}
                          </Group>
                        </Card>
                      )
                    })}
                  </Group>
                </Box>
              </Box>
            ) : (
              /* MOBILE LAYOUT */
              <Box style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* TOP - Compagno */}
                <Box style={getBoxStyle("Compagno", true)}>
                  <Group justify='center' style={{ flexDirection: 'row', gap: '4px', flexWrap: 'wrap' }}>
                    {partnerHand.map((card) => (
                      <Card key={`${card.suit}-${card.value}`} shadow="sm" padding="xs" radius="md" withBorder style={{ backgroundColor: "cyan", minWidth: '40px' }}>
                        <Group style={{ flexDirection: "column" }}>
                          <IconQuestionMark size={16} />
                        </Group>
                      </Card>
                    ))}
                  </Group>
                </Box>

                {/* CENTER INFO & BUTTONS */}
                {cardOut !== null && <Box style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                  <Stack align="center" justify="center" gap="xs">
                    {phase === "play" && seme !== null && <Text size="sm">Si gioca a: {seme}</Text>}
                    {phase === "play" && haMandato !== null && <Text size="sm">{haMandato === "Giocatore" ? "Ha mandato la tua squadra" : "Ha mandato la squadra avversaria"}</Text>}
                    {phase === "play" && <Text size="sm">Turno di: {turn}</Text>}

                    {phase !== "play" && <Card shadow="sm" padding="md" radius="md" withBorder>
                      <Group style={{ flexDirection: "column" }}>
                        <Text style={{ color: cardOut!.suit === "Cuori" || cardOut!.suit === "Quadri" ? "red" : "black", fontSize: '20px' }}>{cardOut!.value}</Text>
                        {cardOut!.suit === "Cuori" && <IconHeartFilled size={24} style={{ color: "red" }} />}
                        {cardOut!.suit === "Quadri" && <IconDiamondFilled size={24} style={{ color: "red" }} />}
                        {cardOut!.suit === "Fiori" && <IconClubsFilled size={24} style={{ color: "black" }} />}
                        {cardOut!.suit === "Picche" && <IconSpadeFilled size={24} style={{ color: "black" }} />}
                      </Group>
                    </Card>}

                    {turn === "Giocatore" && <>
                      {phase === "pick" && <>
                        <Group justify="center" grow gap="xs">
                          <Button leftSection={<IconXboxX size={16} />} variant="light" color="red" onClick={() => handlePass()} size="xs">Via</Button>
                          <Button leftSection={<IconCircleCheck size={16} />} variant="light" color="green" onClick={() => handleAccept(turn, cardOut!.suit)} size="xs">Mando</Button>
                        </Group>
                      </>}
                      {phase === "second" && <>
                        <Group justify="center" wrap="wrap" gap="xs" style={{ justifyContent: 'center' }}>
                          <Button leftSection={<IconXboxX size={14} />} variant="light" color="red" onClick={() => handleSecondPass()} size="xs">Due</Button>
                          {cardOut.suit !== "Cuori" && <Button leftSection={<IconHeartFilled size={14} />} variant="light" color="green" onClick={() => handleAccept("Giocatore", "Cuori")} size="xs">C</Button>}
                          {cardOut.suit !== "Quadri" && <Button leftSection={<IconDiamondFilled size={14} />} variant="light" color="green" onClick={() => handleAccept("Giocatore", "Quadri")} size="xs">Q</Button>}
                          {cardOut.suit !== "Fiori" && <Button leftSection={<IconClubsFilled size={14} />} variant="light" color="green" onClick={() => handleAccept("Giocatore", "Fiori")} size="xs">F</Button>}
                          {cardOut.suit !== "Picche" && <Button leftSection={<IconSpadeFilled size={14} />} variant="light" color="green" onClick={() => handleAccept("Giocatore", "Picche")} size="xs">P</Button>}
                          <Button variant="light" color="blue" onClick={() => handleAccept("Giocatore", "Senza")} size="xs">Senza</Button>
                        </Group>
                      </>}
                    </>}

                    {phase === "play" && inCampo.length > 0 && <>
                      <Group justify='center' style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '6px' }}>
                        {inCampo.map((card) => (
                          <Card key={`${card.suit}-${card.value}`} shadow="sm" padding="md" radius="md" withBorder style={{ minWidth: '50px' }}>
                            <Group style={{ flexDirection: "column" }}>
                              <Text size="sm" style={{ color: card.suit === "Cuori" || card.suit === "Quadri" ? "red" : "black" }}>{card.value}</Text>
                              {card.suit === "Cuori" && <IconHeartFilled size={20} style={{ color: "red" }} />}
                              {card.suit === "Quadri" && <IconDiamondFilled size={20} style={{ color: "red" }} />}
                              {card.suit === "Fiori" && <IconClubsFilled size={20} style={{ color: "black" }} />}
                              {card.suit === "Picche" && <IconSpadeFilled size={20} style={{ color: "black" }} />}
                            </Group>
                          </Card>
                        ))}
                      </Group>
                    </>}

                    <Popover width={280} position="top" withArrow shadow="md">
                      <Popover.Target>
                        <Button variant="light" color="blue" size="xs">Log</Button>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <List style={{ maxHeight: "40vh", overflowY: "auto" }}>
                          {log.map((entry, index) => (
                            <List.Item key={index}>
                              <Text size="xs">{entry}</Text>
                            </List.Item>
                          ))}
                        </List>
                      </Popover.Dropdown>
                    </Popover>
                  </Stack>
                </Box>}

                {/* MIDDLE - Nemico 2 and Nemico 1 on sides */}
                <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'start', width: '100%' }}>
                  {/* LEFT - Nemico 2 */}
                  <Box style={getBoxStyle("Nemico 2", true)}>
                    <Stack align="center" gap="4px">
                      <Text size="xs" fw={500}>Nemico 2</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', justifyItems: 'center' }}>
                        {enemy2Hand.map((card) => (
                          <Card key={`${card.suit}-${card.value}`} shadow="sm" padding="xs" radius="md" withBorder style={{ backgroundColor: "cyan", width: '45px', height: '60px' }}>
                            <Group style={{ flexDirection: "column", justifyContent: 'center', height: '100%' }}>
                              <IconQuestionMark size={18} />
                            </Group>
                          </Card>
                        ))}
                      </div>
                    </Stack>
                  </Box>

                  {/* RIGHT - Nemico 1 */}
                  <Box style={getBoxStyle("Nemico 1", true)}>
                    <Stack align="center" gap="4px">
                      <Text size="xs" fw={500}>Nemico 1</Text>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px', justifyItems: 'center' }}>
                        {enemy1Hand.map((card) => (
                          <Card key={`${card.suit}-${card.value}`} shadow="sm" padding="xs" radius="md" withBorder style={{ backgroundColor: "cyan", width: '45px', height: '60px' }}>
                            <Group style={{ flexDirection: "column", justifyContent: 'center', height: '100%' }}>
                              <IconQuestionMark size={18} />
                            </Group>
                          </Card>
                        ))}
                      </div>
                    </Stack>
                  </Box>
                </Box>

                {/* PLAYER HAND - BOTTOM */}
                <Box style={getBoxStyle("Giocatore", true)}>
                  <Stack gap="6px">
                    <Text size="xs" fw={500} ta="center">La tua mano</Text>
                    <Group justify='center' style={{ flexDirection: 'row', gap: '4px', flexWrap: 'wrap' }}>
                      {playerHand.map((card) => {
                        const isPlayable = phase === "play" && turn === "Giocatore" && cartaGiocabile(card)
                        return (
                          <Card
                            onClick={() => playCard("Giocatore", card)}
                            key={`${card.suit}-${card.value}`}
                            shadow="sm"
                            padding="sm"
                            radius="md"
                            withBorder
                            className={isPlayable ? 'card-clickable' : undefined}
                            style={{ minWidth: '50px', cursor: isPlayable ? 'pointer' : 'default', opacity: isPlayable ? 1 : 0.7 }}
                          >
                            <Group style={{ flexDirection: "column" }}>
                              <Text size="sm" style={{ color: card.suit === "Cuori" || card.suit === "Quadri" ? "red" : "black" }}>{card.value}</Text>
                              {card.suit === "Cuori" && <IconHeartFilled size={20} style={{ color: "red" }} />}
                              {card.suit === "Quadri" && <IconDiamondFilled size={20} style={{ color: "red" }} />}
                              {card.suit === "Fiori" && <IconClubsFilled size={20} style={{ color: "black" }} />}
                              {card.suit === "Picche" && <IconSpadeFilled size={20} style={{ color: "black" }} />}
                            </Group>
                          </Card>
                        )
                      })}
                    </Group>
                  </Stack>
                </Box>
              </Box>
            )}
          </Skeleton>
        </div>
      </Center>

      <Modal opened={gameOver} onClose={() => {
        closeGameOver()
        resetGame()
      }} size={isMobile ? "sm" : "auto"} radius={"md"} centered w={"auto"} title="Risultato Partita">
        <Grid my="md" grow justify="center" align="center" style={{ width: "100%" }}>
          <Grid.Col span={isMobile ? 12 : 6}>
            <Text size={isMobile ? "sm" : "md"}>Punti della tua squadra: {puntiGiocatoreFinali}</Text>
          </Grid.Col>
          <Grid.Col span={isMobile ? 12 : 6}>
            <Text size={isMobile ? "sm" : "md"}>Punti degli avversari: {puntiAvversariFinali}</Text>
          </Grid.Col>
        </Grid>
        {puntiGiocatoreFinali > puntiAvversariFinali && <Text size={isMobile ? "md" : "lg"} color="green">Hai vinto!</Text>}
        {puntiGiocatoreFinali < puntiAvversariFinali && <Text size={isMobile ? "md" : "lg"} color="red">Hai perso!</Text>}
        {puntiGiocatoreFinali === puntiAvversariFinali && <Text size={isMobile ? "md" : "lg"} color="gray">Pareggio!</Text>}
        {puntiAvversariFinali > puntiGiocatoreFinali && haMandato === "Giocatore" && <Text size={isMobile ? "xs" : "md"} color="red">Sei andato a bagno!</Text>}
        {puntiGiocatoreFinali > puntiAvversariFinali && haMandato === "Avversari" && <Text size={isMobile ? "xs" : "md"} color="green">Gli avversari sono andati a bagno!</Text>}
        {puntiGiocatoreFinali === 0 && <Text size={isMobile ? "xs" : "md"} color="red">Hai preso cappotto!</Text>}
        {puntiAvversariFinali === 0 && <Text size={isMobile ? "xs" : "md"} color="green">Gli avversari hanno preso cappotto!</Text>}
        <Center mt="md">
          <Button onClick={() => {
            closeGameOver()
            resetGame()
          }} size={isMobile ? "sm" : "md"}>Nuova Partita</Button>
        </Center>
      </Modal>
    </MantineProvider>
  )
}





