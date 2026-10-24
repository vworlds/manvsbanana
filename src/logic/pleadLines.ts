// The big pool of Act 2 dialogue. Every game deals a random hand from here.
//
// Each member has ~12 lines per tone, six moods (each with several opening
// hints and its own score table) and pools of reactions. A round shows one
// random line per tone, so you are always choosing a *tone* against a hidden
// mood, but the words are different every time.
//
// Scores: 3 = exactly what they needed, 0 = meh, negative = you made it worse.

import type { MemberId, Result, Tone } from './plead';

export interface MoodDef {
  id: string;
  hints: string[];
  scores: Record<Tone, number>;
}

export interface MemberDef {
  id: MemberId;
  name: string;
  lines: Record<Tone, string[]>;
  moods: MoodDef[];
  reactions: Record<Result, string[]>;
}

export const WIFE: MemberDef = {
  id: 'wife',
  name: 'Wife',
  lines: {
    sweet: [
      "Honey, please. They're still good. Mostly.",
      'I picked these out just for you. With my own hands.',
      'Remember our honeymoon? There were bananas there. Probably.',
      'You look beautiful tonight. Eat a banana.',
      'Babe. Sweetheart. Light of my life. Banana?',
      'I love you more than these bananas. Barely. Eat one.',
      'Just one bite. For us. For our marriage.',
      'They match your eyes. Your brown, tired eyes.',
      "I wrote you a poem. It's about potassium.",
      'You deserve the finest fruit. These are... fruit.',
      'Let me peel it for you, my queen.',
      'Do it for the man you married, not the man I am now.',
    ],
    yell: [
      'EAT THESE FUCKING BANANAS, YOU GODDAMN MONSTERS!',
      'I DID NOT RUN FOUR RED LIGHTS FOR THIS SHIT!',
      'WHAT ARE YOU WAITING FOR? A FUCKING INVITATION?',
      'THIS IS A CODE YELLOW, GODDAMMIT!',
      'I SWEAR TO GOD I WILL EAT ALL OF THEM MYSELF!',
      'PEEL. CHEW. SWALLOW. HOW FUCKING HARD IS IT?',
      'DO YOU KNOW WHAT BANANAS COST NOW? DO YOU?!',
      'NOBODY LEAVES THIS TABLE UNTIL THE BUNCH IS GONE!',
      'I HAD A SHITTY DAY AND I WANT TO WATCH YOU EAT FRUIT!',
      'OPEN WIDE OR SO HELP ME!',
      'THESE BANANAS ARE MY LEGACY, DAMMIT!',
      "I'M NOT YELLING! THE BANANAS ARE YELLING!",
    ],
    bribe: [
      "I'll do the dishes. For a week. A MONTH.",
      "Eat one and I'll finally fix the garage door.",
      'One banana = one foot massage. No limit.',
      "I'll watch your show with you. The one with all the crying.",
      "Eat one and I'll call your mother. Voluntarily.",
      "Banana now, spa weekend later. I'm serious this time.",
      "I'll stop doing the thing. You know the thing.",
      'First banana gets the TV remote for a year.',
      "I'll take out the trash without being asked. Twice.",
      "Eat it and I'll never mention your ex's car again.",
      "I'll let you pick the restaurant. And I won't complain.",
      "Two bananas and I'll throw out this sweater. Finally.",
    ],
    guilt: [
      "I ran over a guy for these. Don't you see? I tried.",
      'My father bought bananas. His father bought bananas. And now this?',
      'I gave up my dreams for this family. And these bananas.',
      "Fine. I'll just sit here. With my rotting bananas. Alone.",
      "The cashier believed in me. Why can't you?",
      "I texted 'banana emergency.' You left me on read.",
      'I nearly died on the highway. For POTASSIUM.',
      "I'm not crying. It's banana gas.",
      'Do you know how it feels to be outrun by fruit?',
      'I just wanted ONE thing to go right today.',
      'Remember when you used to love me? And fruit?',
      'The bananas trusted me. Now look at them.',
    ],
  },
  moods: [
    { id: 'tired', hints: ["*sigh* It's 9 PM. I have had a day.", 'I just sat down. I JUST sat down.', "Can this wait until I'm dead?"], scores: { sweet: 1, yell: -2, bribe: 3, guilt: 0 } },
    { id: 'romantic', hints: ['You never bring me anything anymore.', 'Remember when you used to surprise me?', 'Our anniversary was yesterday. Just saying.'], scores: { sweet: 3, yell: -2, bribe: 1, guilt: -1 } },
    { id: 'worried', hints: ['Why are you sweating? Why is the car on the lawn?', 'Was that a siren following you home?', 'Honey, your eye is twitching.'], scores: { sweet: 0, yell: -3, bribe: -1, guilt: 3 } },
    { id: 'petty', hints: ['Oh, NOW you care about groceries?', 'You forgot the milk. Again.', 'Did you get the oat milk? No? Interesting.'], scores: { sweet: -1, yell: -2, bribe: 3, guilt: 1 } },
    { id: 'fedup', hints: ["If you yell one more time, I'm going to my sister's.", 'I swear to God.', 'Choose your next words very carefully.'], scores: { sweet: 3, yell: -3, bribe: 0, guilt: 1 } },
    { id: 'amused', hints: ["Ha. Look at you. You're vibrating.", 'Is this a bit? Are you filming this?', 'Okay, banana man. Go on. Impress me.'], scores: { sweet: 0, yell: 3, bribe: -1, guilt: 1 } },
  ],
  reactions: {
    great: ['...Okay. That was actually sweet.', 'Fine. FINE. Give me one.', 'Oh my God. Okay. One.', "I hate that that worked.", '*takes a banana, smiling against her will*', 'You know what? Sure.'],
    ok: ['Mm-hm.', 'We have literally three bunches already.', 'Maybe after the baby sleeps.', '*checks phone*', 'Sure. Later. Probably.', "I'll think about it."],
    bad: ['Not in front of the baby.', 'Who even ARE you right now?', "I'm calling my sister.", 'You need therapy, not fruit.', '*leaves the chat*', 'Absolutely not.'],
  },
};

export const KID: MemberDef = {
  id: 'kid',
  name: 'Kid',
  lines: {
    sweet: [
      'Bananas make you big and strong, champ!',
      'Did you know monkeys are cool? Monkeys eat bananas!',
      "Let's do the banana dance! You LOVE the banana dance!",
      "You're my favorite kid. Don't tell the baby. Banana?",
      'Bananas are basically candy. Nature candy!',
      'Astronauts eat bananas. True story. Probably.',
      'Your favorite YouTuber eats bananas. I checked.',
      "I'll cut it into little coins, like when you were small!",
      'Banana plus you equals best buddies forever!',
      'Superheroes get their powers from bananas, buddy.',
      "Want a banana boat? I'll do the boat noises.",
      'Daddy picked the most special one just for you.',
    ],
    yell: [
      'WHAT ARE YOU WAITING FOR, YOU LITTLE PIECE OF SHIT?',
      "EAT IT OR I'M SELLING YOUR XBOX!",
      'YOU WILL EAT THIS BANANA AND YOU WILL LIKE IT!',
      "I DIDN'T RAISE A BANANA HATER! ...DID I?!",
      'GET IN THERE AND CHEW, SOLDIER!',
      "DON'T YOU ROLL YOUR EYES AT MY FUCKING FRUIT!",
      'IN THIS HOUSE WE EAT THE GODDAMN BANANAS!',
      "ONE MORE 'OK BOOMER' AND YOU'RE GROUNDED TILL 2040!",
      "MONEY DOESN'T GROW ON TREES! BANANAS DO! AND THEY'RE DYING!",
      'CHEW, DAMMIT, CHEW!',
      'THIS IS WHY GRANDPA CRIED AT CHRISTMAS!',
      'EAT IT NOW OR EAT IT IN YOUR SLEEP!',
    ],
    bribe: [
      'One banana = ten minutes of iPad.',
      "Eat two and I'll pretend I never saw the gaming chair receipt.",
      'Five bucks. Cash. Right now. Peel it.',
      'Eat one and you can stay up till ten. Eleven. Whatever.',
      'Banana now, pizza tomorrow. Deal?',
      "Eat it and I'll stop wearing socks with sandals.",
      "I'll buy you that skin. The game skin. Not a banana skin.",
      "Eat it and I'll never pick you up from school in my robe again.",
      "A banana for a Robux. That's a currency, right?",
      "I'll let you drive the car. In the driveway. For one minute.",
      "Eat one and I'll unblock TikTok.",
      'Finish the bunch and you get to name the next baby.',
    ],
    guilt: [
      "When I was your age I'd have KILLED for a banana.",
      "Grandpa never bought ME bananas. You're so lucky.",
      "Some day you'll be a dad. And you'll remember this moment.",
      "You used to call me 'Banana Daddy.' What happened?",
      "I'm not mad. I'm just... bananappointed.",
      'Every time a kid refuses a banana, a dad somewhere cries.',
      'I drove like a maniac so you could grow up strong.',
      'Do you want me to end up like Grandpa? Do you?',
      'I gave you my eyes, my nose AND my hairline. Eat.',
      "One day I'll be gone, and all you'll have is this banana.",
      'I hit a guy with the car for you, buddy.',
      'Your future kids are watching. Set an example.',
    ],
  },
  moods: [
    { id: 'smug', hints: ['Bananas are for boomers, Dad.', 'OK boomer. What now?', 'Did you seriously drive like that for FRUIT?'], scores: { sweet: -1, yell: 0, bribe: 3, guilt: -2 } },
    { id: 'bored', hints: ['Can I have my iPad back?', 'This is so boring. Can I go?', 'Ugh. Family time again?'], scores: { sweet: 3, yell: -2, bribe: 1, guilt: -1 } },
    { id: 'hungry', hints: ["What's for dinner? Not bananas, right?", "I'm STARVING. Is there pizza?", 'My stomach is eating itself.'], scores: { sweet: 3, yell: -2, bribe: 2, guilt: 0 } },
    { id: 'scared', hints: ['Dad... why is there a guy on our hood?', 'Are... are we in trouble?', 'I heard the crash, Dad.'], scores: { sweet: 2, yell: -3, bribe: 0, guilt: 3 } },
    { id: 'rebel', hints: ["I'm vegan now. Bananas probably aren't vegan.", "I'm on a carnivore diet. Like that podcast guy.", 'Fruit is just sugar, Dad. Look it up.'], scores: { sweet: -2, yell: 3, bribe: 0, guilt: -1 } },
    { id: 'sleepy', hints: ['*yawns* Can I go to bed?', "It's past my bedtime...", 'Five more minutes...'], scores: { sweet: 3, yell: -3, bribe: 1, guilt: 0 } },
  ],
  reactions: {
    great: ["...Fine. But I'm not finishing it.", 'Whatever. Gimme.', 'Okay that was kinda funny. One.', "Deal. Don't tell my friends.", '*eats it while maintaining eye contact*', "Ugh. FINE."],
    ok: ['Ugh. Maybe later.', "You're being so weird.", '*shrugs*', 'I guess.', "I'll eat it after this video.", 'Mmmaybe.'],
    bad: ['OK boomer.', "I'm telling Mom you swore. Again.", "I'm putting this on the internet.", 'This is why I like Uncle Rick more.', '*films you for TikTok*', 'Cringe.'],
  },
};

export const BABY: MemberDef = {
  id: 'baby',
  name: 'Baby',
  lines: {
    sweet: [
      'Here comes the airplane! Nyeeoooww!',
      'Who wants a nana? Who wants a nana?',
      'Choo choo! The banana train is coming in!',
      'Nana! Nana! Say nana! Eat nana!',
      "Look, banana phone! Ring ring! It's for you!",
      "Peekaboo! It's a banana!",
      'Mmm, nummy nummy nana!',
      'A little banana for my little banana!',
      'Here comes the submarine! Blub blub!',
      'Who loves bananas? You do! Yes you do!',
      'Daddy made a banana duck! Quack!',
      'The itsy bitsy banana went up the... mouth!',
    ],
    yell: [
      'OPEN YOUR MOUTH. OPEN YOUR FUCKING MOUTH.',
      'EAT IT, YOU TINY DICTATOR!',
      "I KNOW YOU HAVE TEETH, I'VE FELT THEM!",
      'NO MORE MILK UNTIL YOU EAT FRUIT!',
      "SWALLOW, GODDAMMIT, I'VE SEEN YOU EAT A CRAYON!",
      "WHO'S THE PARENT HERE? ...ME! I AM!",
      'YOU ATE A BUG YESTERDAY! EAT THE BANANA!',
      'STOP SPITTING AND START LIVING!',
      'THIS IS NOT A NEGOTIATION, YOU LITTLE POTATO!',
      'MOUTH. BANANA. NOW. PLEASE. FUCK.',
      'I CHANGED YOUR DIAPER FOR THIS?!',
      'IT IS MUSHY! YOU LOVE MUSHY SHIT!',
    ],
    bribe: [
      '*mashes banana into a sad yellow paste*',
      '*dips banana in milk like a desperate genius*',
      '*hides banana inside the pacifier somehow*',
      '*offers banana AND the car keys*',
      '*does a little dance with the banana*',
      '*balances banana on the TV remote*',
      '*shakes the rattle, then the banana*',
      '*makes the banana talk in a funny voice*',
      '*smears banana on the favorite teddy*',
      '*trades banana for one (1) shiny spoon*',
      '*sings the banana song from the cartoon*',
      '*builds the banana a tiny throne*',
    ],
    guilt: [
      'Daddy is begging you. Daddy has nothing left.',
      'You were born the day bananas were on sale. Fate.',
      'Daddy crashed the car. For you. For nana.',
      "Mommy won't eat them. You're my last hope.",
      "Do it for your brother. He's turning against me.",
      "Daddy's crying, see? Those are banana tears.",
      "If you don't eat it, the bananas died for nothing.",
      "I'll write it in my will: 'The baby didn't eat the banana.'",
      'Daddy used to be cool. Before nanas.',
      "I'm just a man, standing in front of a baby, asking it to eat a banana.",
      "Grandpa's watching from heaven. He's disappointed.",
      'Daddy has one job, baby. ONE.',
    ],
  },
  moods: [
    { id: 'hungry', hints: ['*chews own fist aggressively*', '*gnaws on the table*', '*stares at the banana with intent*'], scores: { sweet: 2, yell: -2, bribe: 3, guilt: 0 } },
    { id: 'cranky', hints: ['*screams at a frequency only dogs can hear*', '*throws pacifier at your face*', '*red-faced fury noises*'], scores: { sweet: -1, yell: -3, bribe: 1, guilt: 3 } },
    { id: 'sleepy', hints: ['*yawns, judging you*', '*eyes slowly closing*', '*drools peacefully*'], scores: { sweet: 3, yell: -3, bribe: 0, guilt: 1 } },
    { id: 'playful', hints: ['*giggles and claps*', '*blows raspberries at you*', '*grabs your nose and honks it*'], scores: { sweet: 3, yell: -1, bribe: 2, guilt: -1 } },
    { id: 'suspicious', hints: ['*narrows tiny eyes*', '*side-eyes the banana*', '*points at the brown spots*'], scores: { sweet: 0, yell: -2, bribe: 3, guilt: 1 } },
    { id: 'teething', hints: ['*drools and whimpers*', '*bites everything in reach*', '*cries at the spoon*'], scores: { sweet: 1, yell: -2, bribe: 3, guilt: 0 } },
  ],
  reactions: {
    great: ['*gums the banana*', '*happy gurgle*', '*claps with banana hands*', '*eats it, then reaches for more*', '*coos approvingly*', '*banana smile*'],
    ok: ['*stares blankly*', '*spits half of it out*', '*licks it once, considers*', '*drops it on the floor*', '*hiccups*', '*pats the banana*'],
    bad: ['WAAAAAAAAAAHHH', '*projectile screams*', '*throws banana at the wall*', '*cries in a way that feels personal*', 'BLEEEAAAARGH', '*smears banana on your shirt*'],
  },
};

export const MEMBER_DEFS: MemberDef[] = [WIFE, KID, BABY];

/** Dad's entrance and the wife's verdicts also vary between games. */
export const ENTRANCE = ['FAMILY! I HAVE BANANAS!', 'EVERYBODY TO THE TABLE! BANANA TIME!', 'HONEY, I\'M HOME! WITH FRUIT!', 'NOBODY PANIC! I HAVE BANANAS!'];
export const EMERGENCY = [
  'BANANA EMERGENCY! EAT THESE FUCKING BANANAS BEFORE THEY GO BAD!',
  'CODE YELLOW! CODE YELLOW! EAT THESE GODDAMN BANANAS NOW!',
  'THIS IS NOT A DRILL! EAT THE FUCKING BANANAS!',
  'THEY ARE TURNING AS WE SPEAK! EAT THEM, YOU MONSTERS!',
];
export const PARDON = ['...Just go get more. GREEN ones this time.', 'Fine. Go back. Get fresh ones. And drive normal.', '*sigh* The store closes at ten. Go.', 'You have one more chance. ONE.'];
export const PROMISE = ['I WILL NOT FAIL YOU AGAIN!', 'I WILL RETURN! WITH POTASSIUM!', 'THIS TIME FOR SURE!', 'THE BANANAS WILL NOT BEAT ME TWICE!'];

// ------------------------------------------------------------- the "win"
// He made it home in time. They eat the bananas. They are not impressed.
export const PROUD = [
  "Who's the man? Daddy's the man.",
  'Fresh. Bananas. Delivered. You may applaud.',
  'Not a single brown spot. You are welcome.',
  'Behold. The fruit of my labor. Literally.',
  'I would like to be thanked now.',
  'Go on. Tell me I did good.',
];
export const DISDAIN: Record<'wife' | 'kid', string[]> = {
  wife: [
    "...They're a little firm.",
    'My mother buys organic.',
    'You drove on the lawn for THIS?',
    "Mm. They're... bananas.",
    'Did you really have to make it a whole thing?',
    "The neighbors' husband brings mangoes.",
    "I'll eat it. But I want you to know I'm judging you.",
    'These were on sale, weren\'t they.',
  ],
  kid: [
    "Grandpa's bananas were better.",
    'Cool. A banana. Wow. Thanks.',
    "You're literally shaking, Dad.",
    "Jake's dad has a boat.",
    "That's it? That's the whole flex?",
    'You know they sell these online, right?',
    'This is the most boomer thing you\'ve ever done.',
    "I've had better. At school. From a vending machine.",
  ],
};
export const DEMANDS = [
  "We're out. Get more.",
  'Those were small. Get bigger ones.',
  'Next time get the GOOD ones.',
  "We'll need more for tomorrow. Chop chop.",
  'Grandma is coming. Get another bunch.',
  "The baby wants more. Don't look at me, go.",
  'And get milk. And more bananas.',
  'Why are you still standing there? More.',
];
export const RESIGNED = [
  '...More bananas. Of course.',
  "Yes, dear. I'll get more bananas.",
  "I'll... I'll get the keys.",
  'Sure. Why not. Bananas.',
  'This is fine. Everything is fine.',
  'Respect is just one more trip away. I can feel it.',
];
