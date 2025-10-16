import { ref, onUnmounted } from 'vue'

// Melbourne plant tips for when loading takes longer than 3 seconds
const MELBOURNE_PLANT_TIPS = [
  "Melbourne's weather changes faster than a mood ring so pick plants that don't take it personally",
  "Kangaroo Paw loves Melbourne sun almost as much as Melburnians love complaining about the heat",
  "Lavender doesn't care about your watering schedule it just wants sunshine and good vibes",
  "Native grasses like Lomandra are basically the low-maintenance friends of the plant world",
  "Mulch is like sunscreen for your soil in summer",
  "Grevillea flowers are the brunch spots of the bird world always busy and full of lorikeets",
  "Composting is just gourmet dining for your soil",
  "If your plant survives a Melbourne heatwave it deserves a citizenship certificate",
  "Tea Tree blooms are like tiny neon signs for native bees",
  "A layer of mulch keeps your soil cooler than a Fitzroy café playlist",
  "Overwatering succulents is the number one Melbourne gardening crime",
  "Coastal Banksia is the tough local that laughs in the face of seaside winds",
  "Eucalyptus mulch smells better than half the candles at South Melbourne Market",
  "Native bees don't sting but they do judge your plant choices",
  "Autumn planting gives roots time to settle in before summer chaos",
  "River Red Gums are Melbourne's original skyscrapers",
  "Lavender doubles as a plant and a free aromatherapy session",
  "If a plant tag says drought tolerant that's Melbourne speak for I'll be fine",
  "Keep an eye out for council free plant days it's like a plant festival without the ticket price",
  "Vertical gardens are the Melbourne equivalent of turning a laneway into street art",
  "Grevillea is basically a buffet for honeyeaters",
  "Herbs like rosemary are kitchen heroes that also survive Melbourne's mood swings",
  "Kangaroo Paw flowers look like they're ready to high five the sky",
  "Bottlebrush blooms look like nature's version of a red carpet",
  "Melbourne's clay soils need compost like coffee needs milk",
  "Rainwater tanks make your plants happier than a tram arriving on time",
  "Lomandra is proof that some plants just know how to chill",
  "Growing rosemary means your garden smells like a Sunday roast every day",
  "Even small balconies can host a herb jungle just add pots and enthusiasm",
  "Local native plants attract birds faster than seed bells",
  "Plant once in autumn and relax while the roots do all the work",
  "Sea Lavender handles salty wind like a seasoned Mornington surfer",
  "Mulch before summer or prepare to water like it's a full time job",
  "If your soil is sticky after rain you've got classic Melbourne clay",
  "Planting natives is like sending an RSVP to local wildlife saying everyone's invited",
  "Giving plants too much water is like feeding someone six dinners a day",
  "Melbourne gardeners swear by compost the way baristas swear by single origin beans",
  "Bottlebrush attracts bees so efficiently it should get an award",
  "Lavender bushes are like nature's welcome mats soft fragrant and buzzing with life",
  "If your plant survives a Melbourne cold snap it officially counts as resilient",
  "Groundcovers like Creeping Boobialla are the carpets of the native garden world",
  "Tarragon basil and thyme all get along like housemates who actually do the dishes",
  "The River Red Gum has been around longer than Melbourne coffee culture",
  "Sun loving plants thrive here like tourists at St Kilda Beach",
  "Always check if a plant is local means it already understands Melbourne's drama",
  "Bees love blue and purple flowers so plant some and become the host of the hottest garden party",
  "A little shade cloth can save your plants from what locals call surprise summer",
  "Rain brings snails and snails bring chaos protect your leafy greens",
  "Pruning natives lightly after flowering keeps them looking fresh like a post haircut selfie",
  "Growing plants that flower in winter gives the local wildlife a reason to visit even in the cold"
]

// Loading messages organized by context
const LOADING_MESSAGES = {
  profile: [
    "Gathering your plant journey...",
    "Checking on your garden...",
    "Preparing your plant collection...",
    "Loading your green space...",
    "Fetching your favourite plants...",
    "Refreshing your garden dashboard..."
  ],
  timeline: [
    "Building your plant timeline...",
    "Tracking your plant progress...",
    "Reviewing your growing journey...",
    "Loading growth milestones...",
    "Preparing timeline updates...",
    "Fetching plant history..."
  ],
  journal: [
    "Opening your garden journal...",
    "Loading journal entries...",
    "Preparing your plant notes...",
    "Reviewing your observations...",
    "Fetching journal updates...",
    "Gathering plant records..."
  ],
  recommendations: [
    "Finding perfect matches for your garden...",
    "Searching for ideal plants...",
    "Analyzing plant compatibility...",
    "Discovering garden possibilities...",
    "Matching plants to your space...",
    "Curating plant suggestions..."
  ],
  plants: [
    "Loading plant collection...",
    "Discovering plants for you...",
    "Preparing plant catalog...",
    "Fetching plant details...",
    "Browsing plant varieties...",
    "Gathering plant information..."
  ],
  guides: [
    "Loading growing guides...",
    "Preparing garden wisdom...",
    "Fetching helpful tips...",
    "Opening guide library...",
    "Loading expert advice...",
    "Gathering growing guides..."
  ],
  dashboard: [
    "Loading your dashboard...",
    "Preparing garden overview...",
    "Gathering activity updates...",
    "Refreshing dashboard data...",
    "Fetching latest updates...",
    "Building your view..."
  ],
  saving: [
    "Saving your changes...",
    "Updating information...",
    "Processing your request...",
    "Applying updates...",
    "Saving progress...",
    "Storing changes..."
  ],
  general: [
    "Just a moment...",
    "Almost there...",
    "Loading...",
    "Processing...",
    "Getting things ready...",
    "Working on it..."
  ]
}

export type LoadingContext = keyof typeof LOADING_MESSAGES

export interface UseLoadingMessagesOptions {
  context?: LoadingContext
  interval?: number // Interval for rotating messages (ms)
  tipDelay?: number // Delay before showing tips (ms)
}

export function useLoadingMessages(options: UseLoadingMessagesOptions = {}) {
  const {
    context = 'general',
    interval = 4000, // 4 seconds for main message rotation
    tipDelay = 3000  // 3 seconds before showing tips
  } = options

  const currentMessage = ref('')
  const currentTip = ref('')
  const showTip = ref(false)

  let messageInterval: NodeJS.Timeout | null = null
  let tipInterval: NodeJS.Timeout | null = null
  let tipDelayTimeout: NodeJS.Timeout | null = null

  let messageIndex = 0
  let tipIndex = 0

  // Shuffle array for random tips
  const shuffleTips = () => {
    const shuffled = [...MELBOURNE_PLANT_TIPS]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  let shuffledTips = shuffleTips()

  const start = () => {
    const messages = LOADING_MESSAGES[context]

    // Set initial message
    messageIndex = 0
    currentMessage.value = messages[messageIndex]

    // Rotate through loading messages
    messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length
      currentMessage.value = messages[messageIndex]
    }, interval)

    // Start showing tips after delay
    tipDelayTimeout = setTimeout(() => {
      showTip.value = true
      tipIndex = 0
      currentTip.value = shuffledTips[tipIndex]

      // Rotate through tips
      tipInterval = setInterval(() => {
        tipIndex = (tipIndex + 1) % shuffledTips.length

        // Reshuffle when we've gone through all tips
        if (tipIndex === 0) {
          shuffledTips = shuffleTips()
        }

        currentTip.value = shuffledTips[tipIndex]
      }, interval)
    }, tipDelay)
  }

  const stop = () => {
    if (messageInterval) {
      clearInterval(messageInterval)
      messageInterval = null
    }
    if (tipInterval) {
      clearInterval(tipInterval)
      tipInterval = null
    }
    if (tipDelayTimeout) {
      clearTimeout(tipDelayTimeout)
      tipDelayTimeout = null
    }
    showTip.value = false
    currentMessage.value = ''
    currentTip.value = ''
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    stop()
  })

  return {
    currentMessage,
    currentTip,
    showTip,
    start,
    stop
  }
}
