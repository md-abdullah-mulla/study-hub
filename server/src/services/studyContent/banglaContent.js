/**
 * Bangla study content for the concepts of the Semester 6 subjects.
 *
 * Why hand-written: the app has no AI API, so every sentence a student reads
 * must be something we can stand behind. Templates alone produce hollow text,
 * so the knowledge for each concept lives here, written in simple
 * Bangladeshi-Diploma-student Bangla.
 *
 * The English twin of this file is conceptLibrary.js (used by the illustration
 * prompt generator). Both are keyed by the same ids, so a topic that gets a
 * good illustration prompt also gets good study content.
 *
 * shape:
 *   definition  one or two sentences a student can say out loud in an exam
 *   points      the facts worth memorising
 *   steps       the order of events, when the concept has one
 *   example     something from everyday life that makes it click
 *   examAnswer  the answer you would write for a 3-5 mark question
 *   questions   likely short questions
 *   viva        likely viva questions with the answer to say out loud
 */
export const BANGLA_CONTENT = {
  mqtt: {
    definition:
      'MQTT হলো একটা হালকা (lightweight) messaging protocol, যা ছোট IoT ডিভাইসগুলোকে সরাসরি একে অন্যের সাথে কথা না বলিয়ে একটা central broker-এর মাধ্যমে message পাঠাতে ও গ্রহণ করতে দেয়। এখানে যে পাঠায় সে Publisher, যে পায় সে Subscriber।',
    points: [
      'Publisher কখনো Subscriber-এর সাথে সরাসরি connected থাকে না — সব message broker হয়ে যায়।',
      'Message পাঠানো হয় একটা named Topic-এ; যে device ওই Topic-এ subscribe করেছে সে-ই message পায়।',
      'ব্যান্ডউইথ কম লাগে, তাই কম শক্তির sensor device-এও ভালো কাজ করে।',
      'QoS level দিয়ে বোঝানো হয় message পৌঁছানো কতটা নিশ্চিত হবে (0, 1, 2)।',
      'সাধারণত TCP port 1883 এ চলে; TLS ব্যবহার করলে encrypted যোগাযোগ হয়।',
    ],
    steps: [
      'Publisher একটা Topic-এর জন্য message তৈরি করে',
      'Broker message-টা গ্রহণ করে',
      'Broker ওই Topic-এর সব Subscriber-কে message পাঠায়',
      'Subscriber message পেয়ে কাজ করে',
    ],
    example:
      'ঘরের তাপমাত্রা sensor প্রতি মিনিটে “27°C” message টা home/temperature Topic-এ পাঠায়; broker সেটা তোমার mobile app-এ পৌঁছে দেয় — app টা না চালু থাকলে message টা রেখে দেওয়া হয়।',
    examAnswer:
      'MQTT একটি lightweight publish/subscribe messaging protocol। এতে তিনটি মূল অংশ থাকে — Publisher, Broker ও Subscriber। Publisher কোনো নির্দিষ্ট MQTT Topic-এ message publish করে, Broker সেটি গ্রহণ করে ওই Topic-এ subscribe করা সব Subscriber-কে পাঠিয়ে দেয়। এতে publisher ও subscriber-এর সরাসরি connection লাগে না, তাই কম ব্যান্ডউইথে অনেক device একসাথে কাজ করতে পারে। এজন্যই IoT সিস্টেমে MQTT বেশি ব্যবহৃত হয়।',
    questions: [
      'MQTT কী? এটা কোন ধরনের protocol?',
      'MQTT-এ Publisher, Broker ও Subscriber-এর কাজ কী?',
      'MQTT-এ Topic-এর ভূমিকা কী?',
      'MQTT IoT-এর জন্য উপযোগী কেন?',
      'MQTT আর CoAP-এর পার্থক্য লিখো।',
    ],
    viva: [
      { q: 'MQTT-এ broker-এর কাজ কী?', a: 'সব message গ্রহণ করে এবং নির্দিষ্ট Topic-এর subscriber-দের কাছে পৌঁছে দেওয়া।' },
      { q: 'Publisher ও Subscriber কি একে অন্যকে চেনে?', a: 'না, তারা একে অন্যকে চেনে না — দুজনেই শুধু broker আর Topic-এর নাম জানে।' },
      { q: 'MQTT কেন lightweight?', a: 'এর message header খুবই ছোট, তাই কম data ও কম বিদ্যুৎ খরচে কাজ চলে।' },
    ],
  },

  coap: {
    definition:
      'CoAP হলো একটা হালকা request/response protocol, যা HTTP-এর মতোই কাজ করে কিন্তু ছোট message আর UDP ব্যবহার করে — যাতে কম ক্ষমতার IoT device-ও সার্ভারের সাথে কথা বলতে পারে।',
    points: [
      'HTTP-এর মতোই GET, POST, PUT, DELETE method ব্যবহার করে।',
      'UDP-এর উপরে চলে, তাই overhead কম কিন্তু নির্ভরযোগ্যতা নিজে সামলাতে হয়।',
      'সাধারণত M2M (machine to machine) যোগাযোগে ব্যবহার হয়।',
      'CoAP message-এর সাইজ খুব ছোট, তাই 8-bit microcontroller-ও চালাতে পারে।',
    ],
    steps: ['Client request পাঠায়', 'Server request প্রক্রিয়া করে', 'Server response পাঠায়', 'Client ফলাফল ব্যবহার করে'],
    example:
      'একটা smart bulb-কে নেটওয়ার্ক থেকেই জ্বালাতে হলে app একটা POST request পাঠায়; bulb কাজ শেষ করে ছোট একটা response ফেরত দেয় — পুরো ব্যাপারটাই কয়েক বাইটে।',
    examAnswer:
      'CoAP একটি lightweight application-layer protocol, যা constrained device ও নেটওয়ার্কের জন্য তৈরি। এটি HTTP-এর মতো request/response মডেলে চলে এবং GET, POST, PUT, DELETE method সমর্থন করে, কিন্তু UDP-এর উপরে চলে ও message ছোট রাখে। M2M যোগাযোগে এটি বেশি ব্যবহৃত হয়।',
    questions: ['CoAP কী?', 'CoAP আর HTTP-এর মিল ও অমিল কী?', 'CoAP কেন UDP ব্যবহার করে?'],
    viva: [
      { q: 'CoAP কোন layer-এ কাজ করে?', a: 'Application layer-এ, UDP-এর উপরে।' },
      { q: 'CoAP-এর সুবিধা কী?', a: 'message ছোট হয়, তাই কম ব্যাটারি ও কম নেটওয়ার্কে চলে।' },
    ],
  },

  'iot-layers': {
    definition:
      'IoT architecture কয়েকটা layer-এ সাজানো: sensing/perception layer বাস্তব জগৎ থেকে ডেটা নেয়, network layer সেটা বহন করে, processing layer প্রক্রিয়া করে আর application layer ব্যবহারকারীকে দেখায়।',
    points: [
      'Perception (sensing) layer: sensor ও actuator বাস্তব জগতের সাথে যুক্ত থাকে।',
      'Network layer: Wi-Fi, cellular, gateway দিয়ে ডেটা পাঠানো হয়।',
      'Processing/edge layer: ডেটা ছেঁকে নেওয়া ও দরকারি সিদ্ধান্ত নেওয়া হয়।',
      'Application layer: cloud service ও ব্যবহারকারীর app।',
      'প্রতিটি layer শুধু তার উপরের ও নিচের layer-এর সাথে সরাসরি কথা বলে।',
    ],
    steps: [
      'Sensor বাস্তব জগতের তথ্য মাপে',
      'Gateway নেটওয়ার্ক দিয়ে ডেটা পাঠায়',
      'Edge বা cloud ডেটা প্রক্রিয়া করে',
      'Application ব্যবহারকারীকে ফলাফল দেখায়',
    ],
    example:
      'একটা স্মার্ট ফার্মে মাটির sensor (perception) → Wi-Fi gateway (network) → edge device ফিল্টার করে cloud-এ পাঠায় (processing) → কৃষকের app পানি দরকার কি না দেখায় (application)।',
    examAnswer:
      'IoT architecture মূলত চারটি layer-এ বিভক্ত — (১) Perception বা sensing layer, যেখানে sensor ও actuator থাকে; (২) Network layer, যা Wi-Fi, gateway বা cellular দিয়ে ডেটা পরিবহন করে; (৩) Processing layer, যেখানে edge বা cloud ডেটা বিশ্লেষণ করে; এবং (৪) Application layer, যা ব্যবহারকারীর app-এ ফলাফল দেখায়। প্রতিটি layer নির্দিষ্ট কাজ করে এবং উপরের-নিচের layer-এর সাথে যোগাযোগ করে।',
    questions: [
      'IoT architecture-এর layer গুলো কী কী?',
      'প্রতিটি layer-এর কাজ লেখো।',
      'Perception layer আর Application layer-এর পার্থক্য কী?',
    ],
    viva: [
      { q: 'Perception layer-এ কী থাকে?', a: 'Sensor ও actuator, যা বাস্তব জগতের সাথে যুক্ত থাকে।' },
      { q: 'Processing layer কোথায় থাকতে পারে?', a: 'Device-এর কাছে edge node-এ, অথবা দূরে cloud-এ।' },
    ],
  },

  'edge-cloud': {
    definition:
      'Edge computing ডেটা প্রক্রিয়া করে device-এর কাছেই, আর cloud computing করে দূরের data centre-এ; IoT সিস্টেমে সাধারণত দুটোই একসাথে ব্যবহার হয়।',
    points: [
      'Edge computing-এ latency খুব কম, তাই জরুরি সিদ্ধান্ত দ্রুত নেওয়া যায়।',
      'Cloud-এ অনেক ডেটা দীর্ঘদিন জমা রাখা ও বড় বিশ্লেষণ করা যায়।',
      'সব ডেটা cloud-এ পাঠালে ব্যান্ডউইথ ও খরচ দুটোই বাড়ে।',
      'Edge আগে ডেটা ছেঁকে ফেলে, তাই cloud-এ শুধু দরকারি ডেটা যায়।',
    ],
    steps: ['Device ডেটা তৈরি করে', 'Edge তাৎক্ষণিক সিদ্ধান্ত নেয়', 'গুরুত্বপূর্ণ ডেটা cloud-এ যায়', 'Cloud বিশ্লেষণ করে ফলাফল ব্যবহারকারীর কাছে পাঠায়'],
    example:
      'কল-কারখানার নিরাপত্তা ক্যামেরা edge device-এই বুঝে ফেলে কেউ পড়ে গেছে কি না, আর সাথে সাথে alarm বাজায়; রাতের রেকর্ডিং অবশ্য cloud-এ জমা হয় পরের দিন দেখার জন্য।',
    examAnswer:
      'Edge computing হলো ডেটা উৎপন্ন হওয়ার জায়গার কাছেই প্রক্রিয়া করা, আর cloud computing হলো কেন্দ্রীয় data centre-এ প্রক্রিয়া করা। Edge-এ latency কম হয় ও ব্যান্ডউইথ বাঁচে, cloud-এ দীর্ঘমেয়াদি storage ও বড় বিশ্লেষণ সম্ভব। বাস্তব IoT সিস্টেমে দুটোকে একসাথে ব্যবহার করা হয়।',
    questions: ['Edge computing কী?', 'Edge আর cloud computing-এর পার্থক্য লিখো।', 'IoT-তে edge computing কেন দরকার?'],
    viva: [
      { q: 'Edge computing-এর সবচেয়ে বড় সুবিধা কী?', a: 'কম latency — জরুরি সিদ্ধান্ত সাথে সাথে নেওয়া যায়।' },
      { q: 'Cloud-এর কাজ কী?', a: 'বহু ডেটা জমা রাখা ও বড় বিশ্লেষণ করা, দূর থেকে ব্যবহারের সুবিধা দেওয়া।' },
    ],
  },

  sensor: {
    definition:
      'Sensor হলো এমন একটা device, যা বাস্তব জগতের কোনো রাশি (তাপমাত্রা, আলো, নড়াচড়া) মেপে সেটাকে electrical signal-এ রূপান্তর করে, যাতে microcontroller সেটা পড়তে পারে।',
    points: [
      'Analog sensor একটানা voltage দেয়, digital sensor সরাসরি সংখ্যা দেয়।',
      'Sensor-এর output প্রায়ই amplify করে ADC-তে পাঠানো হয়।',
      'Calibration মানে মাপা মান আর আসল মান মিলিয়ে নেওয়া।',
      'Actuator ঠিক উল্টো কাজ করে — signal পেয়ে বাস্তবে কিছু করে (motor, buzzer)।',
    ],
    steps: ['বাস্তবে কিছু বদলায়', 'Sensor signal তৈরি করে', 'Signal amplify ও digital-এ রূপান্তর হয়', 'Microcontroller মানটি পড়ে ব্যবহার করে'],
    example: 'LM35 তাপমাত্রা sensor 25°C-তে প্রায় 250 mV দেয়; microcontroller সেটা পড়ে সেলসিয়াস হিসেবে হিসাব করে দেখায়।',
    examAnswer:
      'Sensor একটি transducer device, যা বাস্তব জগতের ভৌত রাশিকে (তাপমাত্রা, আলো, চাপ) বৈদ্যুতিক signal-এ রূপান্তর করে। এই signal analog হলে amplifier ও ADC দিয়ে microcontroller-এর উপযোগী করা হয়। Sensor-এর মাধ্যমে microcontroller তার পরিবেশ সম্পর্কে জানতে পারে এবং সেই অনুযায়ী কাজ করতে পারে।',
    questions: ['Sensor কী?', 'Sensor আর actuator-এর পার্থক্য লিখো।', 'ADC-এর কাজ কী?'],
    viva: [{ q: 'Sensor-কে transducer বলা হয় কেন?', a: 'কারণ এটি এক ধরনের শক্তি বা রাশিকে অন্য রূপে (বৈদ্যুতিক signal-এ) বদলে দেয়।' }],
  },

  'communication-protocol': {
    definition:
      'Communication protocol হলো কিছু নির্দিষ্ট নিয়ম, যা ঠিক করে দেয় দুটি device কীভাবে ডেটা বিনিময় করবে — কে আগে বলবে, ডেটার format কী হবে, আর ভুল হলে কী হবে।',
    points: [
      'প্রেরক ও গ্রাহক দুজনকেই একই নিয়ম মানতে হয়, নাহলে ডেটা বোঝা যায় না।',
      'কিছু protocol বেশি দূর পর্যন্ত যায় কিন্তু কম speed দেয় (যেমন LoRa)।',
      'কিছু protocol বেশি speed দেয় কিন্তু বেশি বিদ্যুৎ খায় (যেমন Wi-Fi)।',
      'IoT-তে সাধারণত MQTT, CoAP, Zigbee, Bluetooth Low Energy ব্যবহার হয়।',
    ],
    steps: ['প্রেরক নির্দিষ্ট format-এ message তৈরি করে', 'নির্বাচিত medium দিয়ে message যায়', 'গ্রাহক message যাচাই করে পড়ে', 'গ্রাহক উত্তর দেয় বা কাজ করে'],
    example:
      'দুই ব্যক্তি এক ভাষায় কথা না বললে যেমন কথা বোঝা যায় না, তেমনি একটা Wi-Fi sensor আর একটা Zigbee sensor সরাসরি একে অন্যের কথা বুঝতে পারে না — দুটোকে মিলিয়ে দিতে gateway লাগে।',
    examAnswer:
      'Communication protocol হলো ডেটা আদান-প্রদানের কিছু স্বীকৃত নিয়ম, যা message-এর format, পাঠানোর নিয়ম ও ভুল সংশোধনের পদ্ধতি নির্ধারণ করে। প্রেরক ও গ্রাহক উভয়েই একই protocol অনুসরণ করলে তবেই যোগাযোগ সম্ভব। IoT-তে কম বিদ্যুৎ ও কম ব্যান্ডউইথ খরচের জন্য বিশেষ protocol যেমন MQTT ও CoAP ব্যবহার করা হয়।',
    questions: ['Communication protocol কী?', 'IoT-তে কোন কোন protocol ব্যবহৃত হয়?', 'Protocol না থাকলে কী সমস্যা হবে?'],
    viva: [{ q: 'Protocol-এর দুইটা কাজ বলো।', a: 'ডেটার format ঠিক করা এবং ডেটা পাঠানোর নিয়ম ও ভুল সংশোধনের ব্যবস্থা করা।' }],
  },

  'computer-network': {
    definition:
      'Computer network হলো দুই বা তার বেশি computer-এর সংযোগ, যাতে তারা ডেটা ও resource (printer, file, internet) ভাগ করে নিতে পারে। ডেটা প্রেরকের কাছ থেকে ছোট ছোট packet হয়ে network device-এর মধ্য দিয়ে গ্রাহকের কাছে যায়।',
    points: [
      'Network-এর মূল উপকারিতা: ডেটা শেয়ার, resource শেয়ার আর যোগাযোগ।',
      'Switch একই network-এর device-গুলোকে জোড়ে, Router আলাদা network-কে জোড়ে।',
      'LAN ছোট এলাকার (একটা রুম/অফিস), WAN অনেক বড় এলাকার (একটা দেশ পর্যন্ত)।',
      'প্রতিটি device-এর আলাদা address (IP address) থাকে, তাই packet ঠিক জায়গায় পৌঁছায়।',
      'Topology হলো device-গুলো কী আকারে সাজানো আছে — star, bus, ring, mesh।',
    ],
    steps: ['প্রেরক ডেটা তৈরি করে', 'ডেটা packet-এ ভাগ হয়', 'Switch ও router packet পাঠায়', 'গ্রাহক packet জোড়া লাগিয়ে ডেটা পায়'],
    example:
      'তোমার ল্যাপটপ থেকে ফেসবুকে ছবি দেওয়া = ছবি ছোট packet-এ ভাগ হয়ে home router → ISP → সার্ভার-এ পৌঁছানো, আর friend-এর ফোনে সেটা আবার একসাথে জোড়া লাগা।',
    examAnswer:
      'Computer network হলো দুটি বা ততোধিক কম্পিউটারের সংযোগ, যার মাধ্যমে তারা ডেটা ও রিসোর্স শেয়ার করতে পারে। নেটওয়ার্কে ডেটা ছোট ছোট packet আকারে প্রেরক থেকে গ্রাহকের কাছে যায়; switch একই নেটওয়ার্কের ডিভাইস যুক্ত করে এবং router ভিন্ন নেটওয়ার্কের মধ্যে সংযোগ স্থাপন করে। নেটওয়ার্কের সুবিধা — ডেটা শেয়ার, রিসোর্স শেয়ার, দ্রুত যোগাযোগ ও কেন্দ্রীয় নিয়ন্ত্রণ।',
    questions: ['Computer network কী?', 'Network-এর সুবিধাগুলো লেখো।', 'Switch ও router-এর পার্থক্য কী?', 'LAN আর WAN-এর পার্থক্য লিখো।'],
    viva: [
      { q: 'Router একই কাজ করে না switch একই কাজ করে — পার্থক্য কী?', a: 'Switch একই network-এর ভেতরে device জোড়ে, router দুটি আলাদা network-কে জোড়ে।' },
      { q: 'IP address কেন দরকার?', a: 'কোন packet কোন device-এ যাবে তা ঠিক করার জন্য প্রত্যেক device-এর নিজস্ব ঠিকানা দরকার।' },
    ],
  },

  'client-server': {
    definition:
      'Client-server model হলো এমন ব্যবস্থা, যেখানে client সেবা চেয়ে request পাঠায় আর server সেটি প্রক্রিয়া করে response পাঠায়। একটা server একসাথে অনেক client-কে সেবা দিতে পারে।',
    points: [
      'Client request পাঠায়, server response দেয় — এই দুই ধাপেই কাজ হয়।',
      'তথ্য সব server-এ কেন্দ্রীভূত থাকে, তাই ম্যানেজ করা সহজ।',
      'Server নষ্ট হলে পুরো সেবা বন্ধ হয়ে যায় (single point of failure)।',
      'Web browsing, email, online banking — সবই এই model-এ চলে।',
    ],
    steps: ['Client request পাঠায়', 'Server request পায় ও প্রক্রিয়া করে', 'Server response পাঠায়', 'Client ফলাফল দেখায়'],
    example: 'তুমি YouTube-এ ভিডিও চাও (request) → YouTube-এর server ভিডিও পাঠায় (response) → তোমার ব্রাউজার তা চালায়।',
    examAnswer:
      'Client-server model-এ client একটি request পাঠায় এবং server সেই request প্রক্রিয়া করে response ফেরত দেয়। এক্ষেত্রে ডেটা ও সেবা কেন্দ্রীয় server-এ থাকে, ফলে ব্যবস্থাপনা সহজ হয় কিন্তু server নষ্ট হলে সম্পূর্ণ সেবা বন্ধ হয়ে যায়। ইন্টারনেটের ওয়েব, ইমেইল ও ব্যাংকিং সেবা এই মডেলেই পরিচালিত হয়।',
    questions: ['Client-server model কী?', 'এর সুবিধা ও অসুবিধা লেখো।'],
    viva: [{ q: 'Client-server model-এর অসুবিধা কী?', a: 'server নষ্ট হলে বা ব্যস্ত হলে সব client-এর সেবা বন্ধ বা ধীর হয়ে যায়।' }],
  },

  'peer-to-peer': {
    definition:
      'Peer-to-peer (P2P) network-এ কোনো কেন্দ্রীয় server থাকে না — প্রতিটি computer একইসাথে client ও server দুটোই। প্রত্যেকে সবার সাথে সরাসরি ডেটা নিতে ও দিতে পারে।',
    points: [
      'কেন্দ্রীয় server না থাকায় একটার নষ্ট হওয়ায় পুরো network থেমে যায় না।',
      'File sharing-এ খুব জনপ্রিয় (BitTorrent)।',
      'Security ও নিয়ন্ত্রণ কঠিন, কারণ কেউ কেন্দ্রীয়ভাবে দেখাশোনা করে না।',
      'Peer-এর সংখ্যা বাড়লে network-এর ক্ষমতাও বাড়ে।',
    ],
    steps: ['একজন peer network-এ যায়, অন্য peer খুঁজে পায়', 'সরাসরি ডেটা চায়', 'অন্য peer ডেটা পাঠায়', 'একই সময়ে সে অন্যের সেবাও করতে পারে'],
    example: 'একটা টরেন্ট দিয়ে মুভি নামানো — ফাইলটা একজনের কাছ থেকে নয়, অনেক peer-এর কাছ থেকে টুকরো টুকরো আসে।',
    examAnswer:
      'Peer-to-peer network-এ প্রতিটি কম্পিউটার একইসাথে client ও server হিসেবে কাজ করে, কোনো কেন্দ্রীয় server থাকে না। এতে ডেটা সরাসরি peer থেকে peer-এ যায়, ফলে একটির নষ্ট হলে পুরো সিস্টেম বন্ধ হয় না এবং peer বাড়লে সিস্টেমের ক্ষমতাও বাড়ে। তবে কেন্দ্রীয় নিয়ন্ত্রণ না থাকায় নিরাপত্তা রক্ষা করা কঠিন।',
    questions: ['P2P network কী?', 'Client-server ও P2P-এর পার্থক্য লিখো।'],
    viva: [{ q: 'P2P-তে কেন একটার নষ্ট হয়ে অন্যগুলো কাজ করে?', a: 'কারণ কোনো কেন্দ্রীয় server নেই; প্রতিটি peer স্বাধীনভাবে কাজ করে।' }],
  },

  dbms: {
    definition:
      'DBMS (Database Management System) হলো এমন সফটওয়্যার, যা ডেটা সাজিয়ে জমা রাখে, দ্রুত খুঁজে দেয় এবং কে কী দেখতে বা বদলাতে পারবে তা নিয়ন্ত্রণ করে — ব্যবহারকারীকে file নিয়ে হাতড়াতে হয় না।',
    points: [
      'DBMS ডেটার redundancy কমায় এবং consistency রক্ষা করে।',
      'SQL query দিয়ে দ্রুত ডেটা বের করা যায়।',
      'Security ও access control DBMS-এরই দায়িত্ব।',
      'ইনডেক্স না থাকলে খোঁজা ধীর হয়, ইনডেক্স থাকলে খুব দ্রুত হয়।',
      'ভুলভাবে বন্ধ হয়ে গেলেও transaction নিশ্চিত করে ডেটা ঠিক রাখে।',
    ],
    steps: ['ব্যবহারকারী বা app query পাঠায়', 'DBMS query বিশ্লেষণ করে পরিকল্পনা করে', 'প্রয়োজনীয় table-এ পড়া/লেখা হয়', 'ফলাফল ফেরত দেওয়া হয়'],
    example: 'তোমার কলেজের result সফটওয়্যারে রোল দিলেই এক সেকেন্ডে রেজাল্ট আসে — ওটা file খুঁজে নয়, DBMS-এর index করা query-র ফল।',
    examAnswer:
      'DBMS হলো এমন সফটওয়্যার, যা ডেটাবেজ তৈরি, সংরক্ষণ, পরিবর্তন ও ব্যবহার নিয়ন্ত্রণ করে। এটি ডেটার redundancy হ্রাস করে, consistency রক্ষা করে, SQL-এর মাধ্যমে দ্রুত query-র সুবিধা দেয় এবং নিরাপত্তা ও access control নিশ্চিত করে। এজন্যই বড় তথ্য ব্যবস্থাপনায় ফাইল সিস্টেমের বদলে DBMS ব্যবহার করা হয়।',
    questions: ['DBMS কী?', 'DBMS-এর কাজগুলো লেখো।', 'DBMS-এর সুবিধা ৪টি লেখো।', 'DBMS ও file system-এর পার্থক্য কী?'],
    viva: [
      { q: 'DBMS-এর দুইটি প্রধান সুবিধা বলো।', a: 'ডেটার redundancy কমায় এবং নিরাপত্তা ও access control নিশ্চিত করে।' },
      { q: 'Primary key কী?', a: 'এমন একটি column (বা column-এর সমষ্টি), যার মান দিয়ে প্রতিটি row-কে আলাদা করে চেনা যায়।' },
    ],
  },

  'file-system': {
    definition:
      'File system ডেটাকে আলাদা আলাদা file ও folder-এ জমা রাখে, কিন্তু DBMS ডেটাকে table-এ সাজিয়ে নিয়মসহ জমা রাখে এবং query দিয়ে খুঁজে দেয় — এই পার্থক্যটাই প্রধান।',
    points: [
      'File system-এ একই তথ্য কয়েক জায়গায় লেখা থাকে (redundancy), তাই অমিল হওয়ার ভয় থাকে।',
      'File system-এ খুঁজতে manual file খোলার দরকার হয়, DBMS-এ SQL query একটা command-এ ফল দেয়।',
      'DBMS access control দেয় — কে কোন তথ্য দেখবে ঠিক করা যায়।',
      'File system ছোট ও সহজ কাজে ভালো, DBMS বড় তথ্য ব্যবস্থায় ভালো।',
    ],
    example:
      'একটা কলেজের ছাত্রদের তিনটা আলাদা file থাকলে একজনের ঠিকানা বদলালে তিন জায়গায় বদলাতে হয়; DBMS-এ একটাই table-এর একটাই row বদলালেই সব জায়গা ঠিক থাকে।',
    examAnswer:
      'File system ডেটা ফাইল আকারে সংরক্ষণ করে, যেখানে DBMS ডেটা টেবিল আকারে সংরক্ষণ করে। File system-এ ডেটার redundancy বেশি, consistency রক্ষা কঠিন এবং খোঁজা ধীর; DBMS-এ redundancy কম, SQL-এর মাধ্যমে দ্রুত query, নিরাপত্তা ও একসাথে অনেকের ব্যবহারের সুবিধা থাকে। তাই বড় ও জটিল ডেটার জন্য DBMS ব্যবহার করা হয়।',
    questions: ['File system ও DBMS-এর পার্থক্য লেখো।', 'File system-এ কী কী অসুবিধা আছে?'],
    viva: [{ q: 'Redundancy মানে কী?', a: 'একই তথ্য একাধিক জায়গায় জমা থাকা, যা অমিল তৈরি করতে পারে।' }],
  },

  microcontroller: {
    definition:
      'Microcontroller হলো একটাই চিপের ভেতরে বসানো ছোট computer, যেখানে CPU, memory আর I/O সব একসাথে থাকে; এটি প্রোগ্রাম অনুযায়ী input পড়ে output চালায়।',
    points: [
      'একই চিপে CPU, ROM (প্রোগ্রাম), RAM (ডেটা) ও I/O port থাকে।',
      'সাধারণত একটা নির্দিষ্ট কাজের জন্য তৈরি — ওজন কম, খরচ কম, বিদ্যুৎ কম।',
      'Interrupt দিয়ে জরুরি ঘটনা এলে সাথে সাথে সাড়া দেওয়া যায়।',
      '8051, AVR (ATmega), PIC — বহুল ব্যবহৃত microcontroller পরিবার।',
    ],
    steps: ['Input port পড়ে', 'প্রোগ্রামের নির্দেশ চালায়', 'Output ও timer আপডেট করে', 'এটা অনবরত চলতে থাকে'],
    example: 'ওয়াশিং মেশিনের ভেতরের microcontroller ঠিক করে দেয় কখন পানি নেবে, কত মিনিট ঘুরবে, কখন থামবে।',
    examAnswer:
      'Microcontroller হলো একটি single-chip micro компьютер, যাতে CPU, ROM, RAM, I/O port, timer ও interrupt নিয়ন্ত্রণ অংশ একসাথে থাকে। এটি কোনো নির্দিষ্ট কাজের জন্য লেখা প্রোগ্রাম চালিয়ে input পড়ে ও output নিয়ন্ত্রণ করে। কম খরচ, কম বিদ্যুৎ খরচ ও ছোট আকারের কারণে এটি embedded সিস্টেমে ব্যাপক ব্যবহৃত।',
    questions: ['Microcontroller কী?', 'Microcontroller-এর প্রধান অংশগুলো লেখো।', 'Microcontroller ও microprocessor-এর পার্থক্য কী?'],
    viva: [
      { q: 'Microcontroller-এ ROM-এর কাজ কী?', a: 'প্রোগ্রামের নির্দেশ স্থায়ীভাবে রাখা, বিদ্যুৎ চলে গেলেও মুছে যায় না।' },
      { q: 'Interrupt কেন দরকার?', a: 'জরুরি ঘটনা ঘটলে পড়ার কাজ ফেলে সাথে সাথে সেই ঘটনা সামলানোর জন্য।' },
    ],
  },

  'memory-organization': {
    definition:
      'Microcontroller-এর memory কাজ অনুযায়ী ভাগ করা: program code থাকে ROM/flash-এ, অস্থায়ী ডেটা থাকে RAM-এ, আর CPU address bus দিয়ে ঠিকানা দিয়ে data bus দিয়ে ডেটা নিয়ে আসে।',
    points: [
      'ROM/flash-এ প্রোগ্রাম থাকে, বিদ্যুৎ না থাকলেও মুছে যায় না।',
      'RAM-এ চলমান ডেটা থাকে, বিদ্যুৎ গেলে মুছে যায়।',
      'Address bus বলে দেয় কোন location, data bus বহন করে আসল মান।',
      'Stack RAM-এ থাকে এবং function call ও return address সামলায়।',
      'External memory যোগ করতে chip-select line ব্যবহার হয়।',
    ],
    steps: ['CPU address bus-এ ঠিকানা দেয়', 'সেই memory block select হয়', 'Data bus দিয়ে মান আসে/যায়', 'CPU মানটি ব্যবহার করে'],
    example: 'তোমার প্রোগ্রাম চুলার গ্যাসের মতো নয় — ROM-এ লেখা প্রোগ্রাম বন্ধ করলেও থাকে, কিন্তু RAM-এর হিসাব বন্ধ করলেই মুছে যায়।',
    examAnswer:
      'Microcontroller-এর মেমোরিকে প্রধানত দুই ভাগে ভাগ করা হয় — program memory (ROM/flash) এবং data memory (RAM)। প্রোগ্রাম নির্দেশ ROM-এ স্থায়ীভাবে থাকে, আর চলমান ডেটা RAM-এ থাকে। CPU address bus-এর মাধ্যমে লোকেশন নির্দেশ করে এবং data bus-এর মাধ্যমে মান আদান-প্রদান করে; chip-select লাইন ঠিক করে কোন memory অংশ উত্তর দেবে।',
    questions: ['ROM ও RAM-এর পার্থক্য লেখো।', 'Address bus ও data bus-এর কাজ কী?'],
    viva: [
      { q: 'Address bus এর কাজ কী?', a: 'CPU কোন memory লোকেশনে কথা বলছে তা নির্দেশ করে।' },
      { q: 'RAM কেন volatile?', a: 'বিদ্যুৎ চলে গেলে RAM-এর সব ডেটা মুছে যায়।' },
    ],
  },

  'timer-interrupt': {
    definition:
      'Timer clock pulse গুনে সময় মাপে, counter বাইরের ঘটনা গুনে, আর interrupt জরুরি ঘটনা ঘটলে CPU-কে সাথে সাথে সাড়া দিতে দেয়।',
    points: [
      'Prescaler দিয়ে clock-এর গতি ভাগ করে বড় delay পাওয়া যায়।',
      'Counter নির্দিষ্ট মানে পৌঁছালে overflow flag সেট হয়।',
      'Interrupt এলে CPU মূল কাজ থামিয়ে ISR চালায়, পরে ফিরে আসে।',
      'Interrupt না থাকলে CPU-কে বারবার চেক করতে হতো (polling), যা সময় নষ্ট করে।',
    ],
    steps: ['Clock pulse বা বাইরের ঘটনা গুনা হয়', 'Counter নির্দিষ্ট মানে পৌঁছায়', 'Interrupt flag সেট হয়', 'CPU ISR-এ যায়, কাজ শেষে ফিরে আসে'],
    example: 'মাইক্রোওয়েভ ওভেনের timer ৩ মিনিট গুনে buzzer বাজায় — পুরোটা গুনা হয় clock pulse দিয়ে।',
    examAnswer:
      'Timer হলো এমন counter, যা নির্দিষ্ট ফ্রিকোয়েন্সির clock pulse গুনে সময় নির্ধারণ করে; counter বাইরের ঘটনা গোনে। নির্দিষ্ট মান শেষ হলে flag বা interrupt তৈরি হয়। Interrupt ব্যবস্থায় CPU তার চলতি কাজ সাময়িকভাবে থামিয়ে ISR চালায় এবং পরে আগের জায়গায় ফিরে আসে, ফলে ঘটনার প্রতিক্রিয়া তাৎক্ষণিক হয়।',
    questions: ['Timer ও counter-এর পার্থক্য লেখো।', 'Interrupt কী? এর সুবিধা লেখো।', 'Prescaler-এর কাজ কী?'],
    viva: [
      { q: 'ISR কী?', a: 'Interrupt Service Routine — interrupt এলে CPU যে ছোট প্রোগ্রাম চালায়।' },
      { q: 'Polling-এর চেয়ে interrupt ভালো কেন?', a: 'বারবার পরীক্ষা করতে হয় না, তাই CPU-র সময় নষ্ট হয় না।' },
    ],
  },

  'io-port': {
    definition:
      'I/O port দিয়ে microcontroller বাইরের জগতের সাথে যুক্ত হয়; ADC analog voltage-কে সংখ্যায় বদলায় আর PWM পালসের ভাগ ঠিক করে analog-এর মতো output দেয়।',
    points: [
      'Port-এর direction register ঠিক করে কোন pin input আর কোনটা output।',
      'Bit masking দিয়ে একটি pin-কে অন্যগুলো না বদলে বদলানো যায়।',
      'ADC-এর resolution বলে দেয় কত সূক্ষ্মভাবে মাপা হবে (যেমন 10-bit → 1024 ধাপ)।',
      'PWM-এ duty cycle বদলালে motor-এর গতি বা LED-এর উজ্জ্বলতা বদলায়।',
    ],
    steps: ['Pin-এর direction ঠিক করা হয়', 'Input পড়া বা output লেখা হয়', 'দরকার হলে ADC দিয়ে analog → digital', 'PWM duty cycle দিয়ে গড় ভোল্টেজ নিয়ন্ত্রণ'],
    example: 'ফ্যানের স্পিড কমানো-বাড়ানো PWM দিয়ে হয় — voltage বদলানো হয় না, বরং প্রতি সেকেন্ডে কত সময় চালু থাকে সেটা বদলানো হয়।',
    examAnswer:
      'I/O port microcontroller-কে বাইরের ডিভাইসের সাথে যুক্ত করে। Direction register দিয়ে ঠিক করা হয় কোন pin ইনপুট আর কোনটি আউটপুট। ADC analog সিগন্যালকে ডিজিটাল মানে রূপান্তর করে, আর PWM নির্দিষ্ট duty cycle-এর পালস তৈরি করে motor বা LED-এর মতো লোড নিয়ন্ত্রণ করে।',
    questions: ['I/O port কী?', 'ADC ও PWM-এর কাজ কী?', 'Duty cycle কী?'],
    viva: [
      { q: 'Duty cycle মানে কী?', a: 'একটি period-এর কত অংশ signal high থাকে তার শতকরা হার।' },
      { q: 'ADC কেন দরকার?', a: 'Sensor-এর analog voltage microcontroller-এর বোঝার জন্য সংখ্যায় বদলাতে।' },
    ],
  },

  'serial-parallel': {
    definition:
      'Serial communication একটির পর একটি bit পাঠায় এক লাইনে, আর parallel communication একসাথে অনেক bit পাঠায় অনেক লাইনে।',
    points: [
      'Serial-এ তার কম লাগে (২-৩টি), তাই দূর পর্যন্ত ডেটা পাঠানো সহজ।',
      'Parallel-এ her অনেক তার লাগে, দূর গেলে অমিল (skew) হয়।',
      'Baud rate হলো এক সেকেন্ডে কত bit যায়।',
      'UART, SPI, I2C — বহুল ব্যবহৃত serial প্রযুক্তি।',
    ],
    steps: ['ডেটা পাঠানোর জন্য প্রস্তুত হয়', 'Bit গুলো যায় (একটি একটি বা একসাথে)', 'গ্রাহক bit জোড়া লাগিয়ে byte বানায়', 'শেষ হলে দুপক্ষ জানান দেয়'],
    example: 'প্রিন্টার cable (parallel) ছোট দূরত্বে দ্রুত ছাপে; আর একটি USB cable (serial) দূর পর্যন্ত কম তারে ডেটা নেয়।',
    examAnswer:
      'Serial communication-এ bit গুলো পালাক্রমে একটি লাইনে পাঠানো হয়, ফলে তার কম লাগে এবং দূর পর্যন্ত ডেটা নির্ভরযোগ্যভাবে যায়। Parallel communication-এ একসাথে কয়েক bit আলাদা লাইনে পাঠানো হয়, ফলে কাছাকাছি দূরত্বে দ্রুত ডেটা পাঠানো যায় কিন্তু বেশি তার লাগে ও দূরে গেলে bit গুলোর অমিল দেখা দেয়।',
    questions: ['Serial ও parallel communication-এর পার্থক্য লেখো।', 'Baud rate কী?', 'Serial communication বেশি ব্যবহৃত হয় কেন?'],
    viva: [{ q: 'UART কী?', a: 'সাধারণ একটি serial communication প্রযুক্তি, যা দুটি ডিভাইসের মধ্যে byte পাঠায়।' }],
  },

  surveillance: {
    definition:
      'Security surveillance system ক্যামেরা ও sensor দিয়ে কোনো জায়গা নজরে রাখে, রেকর্ড রাখে এবং নেটওয়ার্কের মাধ্যমে দূর থেকে দেখতে ও সতর্ক হতে দেয়।',
    points: [
      'প্রধান অংশ: camera, রেকর্ডিং unit (DVR/NVR), নেটওয়ার্ক ও monitoring app।',
      'Live monitoring-এ তৎক্ষণাৎ দেখা যায়, recording-এ পরে প্রমাণ হিসেবে পাওয়া যায়।',
      'Motion detection হলে স্বয়ংক্রিয় alarm ও notification পাঠানো যায়।',
      'নিরাপত্তার জন্য password ও encrypted connection দরকার, নাহলে ভিডিও চুরি হতে পারে।',
    ],
    steps: ['ক্যামেরা দৃশ্য ধারণ করে', 'রেকর্ডিং unit সংকেত encode ও সংরক্ষণ করে', 'নেটওয়ার্ক দিয়ে ভিডিও যায়', 'দূরের ব্যবহারকারী দেখেন বা alarm পান'],
    example: 'দোকানের CCTV রাতে motion টের পেয়ে মালিকের ফোনে notification পাঠায় — কেউ ঢুকলে সাথে সাথে জানা যায়।',
    examAnswer:
      'Security surveillance system-এ ক্যামেরা বা sensor দিয়ে কোনো এলাকা নজরে রাখা হয়। ধারণ করা ভিডিও DVR/NVR-এ সংরক্ষিত হয় এবং নেটওয়ার্কের মাধ্যমে দূরের ব্যবহারকারী live দেখতে পারেন। Motion বা অন্য কোনো ঘটনা ধরা পড়লে স্বয়ংক্রিয়ভাবে সতর্কবার্তা পাঠানো যায়। এতে দূর থেকে নিরাপত্তা নিশ্চিত করা সহজ হয়।',
    questions: ['Surveillance system কী?', 'এর প্রধান অংশগুলো লেখো।', 'Remote monitoring-এর সুবিধা ও অসুবিধা লেখো।'],
    viva: [{ q: 'DVR আর NVR-এর কাজ কী?', a: 'ক্যামেরার ভিডিও গ্রহণ, সংকেত রূপান্তর করে সংরক্ষণ ও ব্যবস্থাপনা করা।' }],
  },

  'access-control': {
    definition:
      'Access control ঠিক করে কে কোথায় ঢুকতে পারবে বা কোন resource ব্যবহার করতে পারবে — প্রথমে পরিচয় যাচাই (authentication), তারপর অনুমতি দেওয়া বা না দেওয়া (authorization)।',
    points: [
      'Authentication = তুমি কে; Authorization = তুমি কী করতে পারবে।',
      'পরিচয় যাচাই হতে পারে card, fingerprint, password বা OTP দিয়ে।',
      'প্রতিটি চেষ্টা log-এ থাকে — কে, কখন ঢুকল বা ঢুকতে পারেনি।',
      'Biometric security system traditional lock-এর চেয়ে নিরাপদ।',
    ],
    steps: ['ব্যবহারকারী পরিচয় দেন', 'Reader পরিচয় যাচাই করে', 'Controller অনুমতি নিয়ম দেখে', 'প্রবেশ দেওয়া বা আটকানো হয় এবং log হয়'],
    example: 'অফিসের দরজায় card ধরলে reader বলতে পারে card টা Director-এর, তাই ঢুকতে দেয়; চোর চেষ্টা করলে denied হয়ে log-এ থেকে যায়।',
    examAnswer:
      'Access control হলো এমন ব্যবস্থা, যা যাচাই করা পরিচয়ের ভিত্তিতে কোনো স্থান বা resource-এ প্রবেশের অনুমতি দেয়। এখানে দুটি ধাপ থাকে — authentication (পরিচয় যাচাই) এবং authorization (অনুমতি নির্ধারণ)। Reader পরিচয় বুঝে Controller-কে জানায়, Controller নিয়ম অনুযায়ী দরজা খোলে বা আটকে রাখে এবং প্রতিটি চেষ্টা record থাকে।',
    questions: ['Access control কী?', 'Authentication ও authorization-এর পার্থক্য লেখো।'],
    viva: [{ q: 'Biometric system-এর সুবিধা কী?', a: 'কার্ড বা পাসওয়ার্ড চুরি করার সুযোগ কম, তাই নিরাপদ।' }],
  },

  'embedded-system': {
    definition:
      'Embedded system হলো কোনো বড় device-এর ভেতরে বসানো ছোট computer, যা একটা নির্দিষ্ট কাজ করে — sensor পড়ে, প্রোগ্রাম অনুযায়ী সিদ্ধান্ত নেয় আর output চালায়।',
    points: [
      'একটি নির্দিষ্ট কাজের জন্য তৈরি, তাই সাধারণ computer-এর মতো সব কাজ করে না।',
      'Firmware হলো এর প্রোগ্রাম, যা সাধারণত বদলানো যায় না।',
      'Real-time মানে নির্দিষ্ট সময়ের মধ্যে উত্তর দিতেই হবে।',
      'কম বিদ্যুৎ ও কম খরচে ২৪ ঘণ্টাও চলতে পারে।',
    ],
    steps: ['পরিবেশ থেকে তথ্য নেয়', 'Firmware অনুযায়ী সিদ্ধান্ত নেয়', 'Output দিয়ে কাজ করে', 'নির্দিষ্ট সময়ের মধ্যে এটা আবার চলে'],
    example: 'গাড়ির ইঞ্জিন control unit, রাইস কুকার, ওয়াশিং মেশিন — সবই embedded system (microcontroller + firmware + sensor + actuator)।',
    examAnswer:
      'Embedded system হলো hardware ও software-এর এমন সমন্বয়, যা একটি নির্দিষ্ট কাজ সম্পাদন করে। এতে সাধারণত microcontroller, sensor ও actuator থাকে এবং firmware নামের নির্দিষ্ট প্রোগ্রাম চলে। এটি কম বিদ্যুৎ খরচে দীর্ঘসময় নিরবচ্ছিন্নভাবে কাজ করতে পারে এবং অনেক ক্ষেত্রে নির্দিষ্ট সময়সীমার মধ্যে ফল দিতে হয়।',
    questions: ['Embedded system কী?', 'Embedded system-এর বৈশিষ্ট্য লেখো।', 'General purpose computer ও embedded system-এর পার্থক্য কী?'],
    viva: [{ q: 'Firmware কী?', a: 'Embedded device-এ স্থায়ীভাবে রাখা প্রোগ্রাম, যা device কী করবে তা ঠিক করে।' }],
  },

  'iot-general': {
    definition:
      'IoT (Internet of Things) মানে সাধারণ জিনিসগুলোকে ইন্টারনেটে যুক্ত করা, যাতে তারা নিজে তথ্য পাঠাতে পারে, দূর থেকে দেখা যায় এবং দরকার হলে নিয়ন্ত্রণ করা যায়।',
    points: [
      'চারটি স্তম্ভ: device/sensor, connectivity, cloud প্ল্যাটফর্ম আর ব্যবহারকারীর app।',
      'Connectivity হতে পারে Wi-Fi, Bluetooth, cellular বা gateway দিয়ে।',
      'Cloud ডেটা সংরক্ষণ ও বিশ্লেষণ করে, app ফল দেখায়।',
      'নিরাপত্তা বড় চ্যালেঞ্জ — device নষ্ট বা দখল হলে বিপদ হতে পারে।',
    ],
    steps: ['Device কিছু মাপে', 'নেটওয়ার্কে ডেটা যায়', 'Cloud সংরক্ষণ ও বিশ্লেষণ করে', 'ব্যবহারকারী দেখেন এবং কমান্ড পাঠাতে পারেন'],
    example: 'স্মার্ট হোমে দরজার sensor, bulb, AC সব একসাথে যুক্ত — app থেকে বাইরে থেকেই দেখা যায় কে এসেছে আর AC বন্ধ করা যায়।',
    examAnswer:
      'IoT হলো এমন প্রযুক্তি, যেখানে দৈনন্দিন device গুলোতে sensor ও নেটওয়ার্ক সংযোগ দিয়ে ইন্টারনেটে যুক্ত করা হয়। এতে device নিজে তথ্য সংগ্রহ ও পাঠায়, cloud তা সংরক্ষণ ও বিশ্লেষণ করে এবং ব্যবহারকারী app-এর মাধ্যমে দূর থেকে মনিটরিং ও নিয়ন্ত্রণ করতে পারেন। IoT-এর মূল উপাদান — sensor, connectivity, cloud ও application।',
    questions: ['IoT কী?', 'IoT-এর মূল উপাদানগুলো লেখো।', 'IoT-এর সুবিধা ও চ্যালেঞ্জ লেখো।'],
    viva: [
      { q: 'IoT-এর সবচেয়ে বড় নিরাপত্তা ঝুঁকি কী?', a: 'দুর্বল password বা পুরোনো firmware থাকলে device হ্যাক হয়ে ডেটা ফাঁস হতে পারে।' },
      { q: 'IoT-তে cloud কেন দরকার?', a: 'বহু device-এর ডেটা জমা রাখা, বিশ্লেষণ ও দূর থেকে ব্যবহারের সুবিধার জন্য।' },
    ],
  },
};

/** ids that have hand-written Bangla content */
export const BANGLA_CONTENT_IDS = Object.keys(BANGLA_CONTENT);
