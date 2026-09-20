/**
 * Concept knowledge for the illustration prompt generator.
 *
 * Why this file exists: a good image prompt needs the *parts* of a concept
 * (MQTT → publisher, broker, subscriber, topic), not just its name. This is a
 * curated library of the concepts a Diploma CST student meets often.
 *
 * It is deliberately open-ended: if a topic matches nothing here, the analyzer
 * (see topicAnalyzer.js) still builds a specific profile from the topic name,
 * its description, the chapter and the subject — so a topic added next month
 * produces a meaningful prompt without touching this file.
 *
 * Each entry:
 *   match         RegExp tested against "subject + chapter + topic"
 *   concept       one or two sentences describing the concept truthfully
 *   components    the labelled parts an illustration should show
 *   flow          ordered steps (used by Process Flow / Architecture diagrams)
 *   relationships how the parts connect (arrows, direction, meaning)
 *   keywords      terminology worth keeping visible in the picture
 */
export const CONCEPT_ENTRIES = [
  {
    id: 'mqtt',
    match: /\bmqtt\b/i,
    concept:
      'MQTT is a lightweight publish/subscribe messaging protocol that lets small IoT devices exchange data through a central broker instead of talking to each other directly.',
    components: [
      'MQTT Publisher (the device that sends a message)',
      'MQTT Broker (the central server that receives and forwards messages)',
      'MQTT Subscriber (the device or app that receives the message)',
      'MQTT Topic (the named channel that messages are published to)',
    ],
    flow: [
      'Publisher sends a message to a named Topic',
      'Broker receives that message',
      'Broker forwards it to every Subscriber of that Topic',
      'Subscriber receives the message and acts on it',
    ],
    relationships: [
      'Publisher → Broker: publish a message',
      'Broker → Subscriber: deliver the message',
      'Messages are matched by Topic name, so publisher and subscriber never need a direct link',
    ],
    keywords: ['publish', 'subscribe', 'broker', 'topic', 'lightweight', 'QoS'],
  },
  {
    id: 'coap',
    match: /\bcoap\b/i,
    concept:
      'CoAP is a lightweight request/response protocol designed for constrained IoT devices, following the same client-server idea as HTTP but with much smaller messages over UDP.',
    components: [
      'CoAP Client (the device that requests data)',
      'CoAP Server (the device or service that answers)',
      'CoAP Request (GET, POST, PUT, DELETE)',
      'CoAP Response (the reply sent back)',
    ],
    flow: [
      'Client sends a request to the server',
      'Server processes the request',
      'Server sends the response back',
      'Client uses the returned data',
    ],
    relationships: [
      'Client → Server: request (GET/POST/PUT/DELETE)',
      'Server → Client: response',
      'Runs over UDP, so messages stay small for low-power devices',
    ],
    keywords: ['request', 'response', 'UDP', 'lightweight', 'constrained device'],
  },
  {
    id: 'iot-layers',
    match: /\b(layers?|architecture)\b/i,
    concept:
      'IoT architecture is a layered system: devices sense the physical world, a network carries their data, and applications process it for the user.',
    components: [
      'Perception / Sensing layer (sensors and actuators in the physical world)',
      'Network layer (Wi-Fi, cellular, gateway that carries the data)',
      'Processing / Edge layer (where data is filtered and pre-processed)',
      'Application layer (cloud services and the user-facing app)',
    ],
    flow: [
      'Sensor reads a physical value',
      'Gateway sends it over the network',
      'Edge or cloud processes the data',
      'Application shows the result to the user',
    ],
    relationships: [
      'Each layer only talks to the layer above and below it',
      'Data moves upward as measurements and downward as commands',
    ],
    keywords: ['perception layer', 'network layer', 'processing layer', 'application layer'],
  },
  {
    id: 'edge-cloud',
    match: /\b(edge|cloud)\s*(computing|layer|server)?\b/i,
    concept:
      'Edge computing processes data near the device, while cloud computing processes it in a central data centre; IoT systems usually use both.',
    components: [
      'IoT devices and sensors (where data is created)',
      'Edge node / gateway (fast local processing)',
      'Cloud servers (storage and heavy analysis)',
      'Users and applications (dashboards, mobile apps)',
    ],
    flow: [
      'Devices create data',
      'Edge node filters and reacts immediately',
      'Important data is sent to the cloud',
      'Cloud stores and analyses it, results reach the user',
    ],
    relationships: [
      'Device → Edge: low-latency local decisions',
      'Edge → Cloud: longer-term storage and analysis',
      'Cloud → User: reports, alerts and control',
    ],
    keywords: ['low latency', 'local processing', 'centralised storage', 'bandwidth'],
  },
  {
    id: 'sensor',
    match: /\b(sensor|actuator|transducer)\b/i,
    concept:
      'A sensor converts a physical quantity (temperature, light, motion) into an electrical signal that a controller can read.',
    components: [
      'Physical quantity being measured',
      'Sensing element (the sensor itself)',
      'Signal conditioning (amplifier / ADC)',
      'Microcontroller reading the value',
    ],
    flow: [
      'Physical change happens',
      'Sensor converts it into an electrical signal',
      'Signal is conditioned and converted to digital',
      'Controller reads and uses the value',
    ],
    relationships: [
      'Physical world → sensor: the input quantity',
      'Sensor → controller: an electrical signal',
    ],
    keywords: ['measurement', 'analog signal', 'digital output', 'calibration'],
  },
  {
    id: 'communication-protocol',
    match: /\b(communication protocols?|http|tcp|udp|zigbee|bluetooth)\b/i,
    concept:
      'IoT communication protocols define how devices exchange data: who may talk, in what format, and what happens if a message is lost.',
    components: [
      'Sender device',
      'Message format (the agreed rules)',
      'Transport medium (Wi-Fi, Zigbee, Bluetooth, cellular)',
      'Receiver device',
    ],
    flow: [
      'Sender prepares a message in the agreed format',
      'Message travels over the chosen medium',
      'Receiver checks and decodes it',
      'Receiver replies or acts',
    ],
    relationships: [
      'Both sides must follow the same rules, otherwise the data cannot be understood',
      'Different protocols trade off range, power use and speed',
    ],
    keywords: ['protocol', 'message format', 'medium', 'range', 'power consumption'],
  },
  {
    id: 'computer-network',
    match: /\b(network|lan|wan|internet|topology)\b/i,
    concept:
      'A computer network connects devices so they can share data and resources; data travels from a sender through network devices to a receiver.',
    components: [
      'Sender device (client or server)',
      'Network interface and cable / wireless link',
      'Connecting devices (switch, router)',
      'Receiving device',
    ],
    flow: [
      'Data is created on the sender',
      'It is broken into packets',
      'Switches and routers forward the packets',
      'The receiver reassembles the data',
    ],
    relationships: [
      'Switch → connects devices inside one network',
      'Router → connects different networks',
      'Sender → receiver: packets with addresses',
    ],
    keywords: ['packet', 'IP address', 'switch', 'router', 'bandwidth'],
  },
  {
    id: 'client-server',
    match: /\b(client[\s/-]*server|client)\b/i,
    concept:
      'In the client-server model, a client requests a service and a server provides it; many clients can use one central server.',
    components: [
      'Client (sends a request)',
      'Request travelling over the network',
      'Server (processes and stores data)',
      'Response returning to the client',
    ],
    flow: [
      'Client sends a request',
      'Server receives and processes it',
      'Server sends a response',
      'Client displays the result',
    ],
    relationships: [
      'Client → Server: request',
      'Server → Client: response',
      'One server can serve many clients at the same time',
    ],
    keywords: ['request', 'response', 'centralised', 'service'],
  },
  {
    id: 'peer-to-peer',
    match: /\b(peer[\s-]*to[\s-]*peer|p2p)\b/i,
    concept:
      'In a peer-to-peer network every device acts as both client and server, so there is no single central server.',
    components: [
      'Peer A (acts as client and server)',
      'Peer B (equals the first peer, no hierarchy)',
      'Peer C (any number of peers can join)',
      'Direct connections between peers',
    ],
    flow: [
      'A peer joins the network and finds other peers',
      'It requests data directly from a peer',
      'The other peer answers with the data',
      'Both peers can also serve others at the same time',
    ],
    relationships: [
      'Peer ↔ Peer: each device requests and answers',
      'No central server, so no single point of failure',
    ],
    keywords: ['decentralised', 'each device is client and server', 'file sharing'],
  },
  {
    id: 'dbms',
    match: /\b(dbms|rdbms|database|sql|table|query|normalization)\b/i,
    concept:
      'A DBMS is software that stores data in an organised way and answers queries, so users and applications never handle raw files themselves.',
    components: [
      'Users and applications',
      'DBMS software (query processing, security, backup)',
      'Database (tables, rows, columns)',
      'Storage on disk',
    ],
    flow: [
      'User or app sends a query',
      'DBMS parses and plans the query',
      'DBMS reads or writes the required tables',
      'Result is returned to the user',
    ],
    relationships: [
      'Application → DBMS: SQL query',
      'DBMS → Database: read / write rows',
      'DBMS hides the physical storage from the user',
    ],
    keywords: ['query', 'table', 'primary key', 'integrity', 'security'],
  },
  {
    id: 'file-system',
    match: /\bfile\s*system\b/i,
    concept:
      'A file system stores data as files in folders, while a DBMS stores structured data with rules and query support — this contrast is what the diagram should show.',
    components: [
      'File system side: separate files in folders',
      'DBMS side: tables with defined columns',
      'How data is searched (manual file scanning vs SQL query)',
      'Sharing and security differences',
    ],
    flow: [
      'Data is stored (files vs tables)',
      'Data is searched (browse and scan vs query)',
      'Data is shared (copy files vs controlled access)',
    ],
    relationships: [
      'Two parallel columns showing the same task done both ways',
      'Arrows pointing out where each approach becomes hard to manage',
    ],
    keywords: ['redundancy', 'consistency', 'query', 'access control'],
  },
  {
    id: 'microcontroller',
    match: /\b(microcontroller|cpu|8051|avr|pic|processor)\b/i,
    concept:
      'A microcontroller is a small single-chip computer: it reads inputs, runs a stored program and drives outputs.',
    components: [
      'CPU (executes the program)',
      'Memory (ROM for the program, RAM for data)',
      'I/O ports (connect sensors and output devices)',
      'Timers, counters and interrupts (timing and event handling)',
    ],
    flow: [
      'Read the input port',
      'Run the program instructions',
      'Update outputs and timers',
      'Repeat continuously',
    ],
    relationships: [
      'CPU ↔ memory: fetch instructions and data over the internal bus',
      'I/O ports ↔ outside world: sensors in, actuators out',
      'Interrupt → CPU: pause the normal flow for an urgent event',
    ],
    keywords: ['CPU', 'ROM', 'RAM', 'I/O port', 'clock', 'embedded program'],
  },
  {
    id: 'memory-organization',
    match: /\bmemory\b/i,
    concept:
      'Microcontroller memory is organised by purpose: program code lives in ROM/flash, temporary data in RAM, and the CPU reaches both over the address and data bus.',
    components: [
      'Program memory (ROM / flash)',
      'Data memory (RAM)',
      'Address bus and data bus',
      'I/O registers and external memory interface',
    ],
    flow: [
      'CPU places an address on the address bus',
      'The memory block is selected',
      'Data moves on the data bus',
      'CPU stores or uses the value',
    ],
    relationships: [
      'Address bus: which location',
      'Data bus: the value itself',
      'Chip-select lines decide which memory answers',
    ],
    keywords: ['address bus', 'data bus', 'ROM', 'RAM', 'memory map'],
  },
  {
    id: 'timer-interrupt',
    match: /\b(timer|counter|interrupt)\b/i,
    concept:
      'Timers count clock pulses to measure time, counters count external events, and interrupts let the CPU react to an event immediately.',
    components: [
      'Clock source',
      'Timer / counter register',
      'Compare value and overflow flag',
      'Interrupt service routine in the CPU',
    ],
    flow: [
      'Clock pulses (or external events) are counted',
      'The counter reaches a set value',
      'An interrupt flag is raised',
      'CPU jumps to the service routine, then returns',
    ],
    relationships: [
      'Timer → interrupt: "this much time has passed"',
      'Counter → value: count of external events',
      'Interrupt → CPU: stop normal flow, handle the event, come back',
    ],
    keywords: ['prescaler', 'overflow', 'interrupt vector', 'delay'],
  },
  {
    id: 'io-port',
    match: /\b(i\/o|input[\s/-]*output|port programming|adc|pwm)\b/i,
    concept:
      'I/O ports connect a microcontroller to the outside world; ADC converts analog sensor voltage into numbers and PWM produces a controllable pulse output.',
    components: [
      'Port pins and their direction registers',
      'Input devices (switch, sensor)',
      'Output devices (LED, motor driver)',
      'ADC / PWM blocks',
    ],
    flow: [
      'Configure the pin direction',
      'Read an input or write an output value',
      'Convert analog to digital (ADC) when needed',
      'Drive analog-like output with PWM duty cycle',
    ],
    relationships: [
      'Direction register → pin: decides input or output',
      'Analog sensor → ADC → digital value inside the CPU',
      'CPU → PWM → average voltage at the load',
    ],
    keywords: ['port register', 'bit masking', 'duty cycle', 'resolution'],
  },
  {
    id: 'serial-parallel',
    match: /\b(serial|parallel|uart|spi|i2c)\b/i,
    concept:
      'Serial communication sends bits one after another on a single line, while parallel communication sends several bits at the same time on separate lines.',
    components: [
      'Transmitter and receiver',
      'Data lines (one pair for serial, many for parallel)',
      'Clock or timing reference',
      'Shift register / buffer that assembles the bits',
    ],
    flow: [
      'Data is prepared for transmission',
      'Bits travel (one by one, or all at once)',
      'Receiver assembles the bits back into a byte',
      'Both sides signal that the transfer finished',
    ],
    relationships: [
      'Serial: fewer wires, longer distance, slower per clock',
      'Parallel: more wires, short distance, faster per clock',
    ],
    keywords: ['baud rate', 'start and stop bit', 'shift register', 'distance'],
  },
  {
    id: 'surveillance',
    match: /\b(surveillance|cctv|camera|monitoring)\b/i,
    concept:
      'A security surveillance system captures video or sensor data on site, sends it over a network, and lets an operator watch or be alerted remotely.',
    components: [
      'Camera / sensor at the monitored place',
      'Local recording or DVR/NVR unit',
      'Network link (internet or LAN)',
      'Operator dashboard / mobile app with alerts',
    ],
    flow: [
      'Camera captures the scene',
      'Recording unit stores and encodes the video',
      'Video streams over the network',
      'Operator watches live or reviews recordings, alerts fire on events',
    ],
    relationships: [
      'Camera → recorder: raw video',
      'Recorder → network: encoded stream',
      'Network → operator: live view and alerts',
    ],
    keywords: ['live view', 'recording', 'alert', 'remote access', 'storage'],
  },
  {
    id: 'access-control',
    match: /\b(access control|authentication|authorization|security)\b/i,
    concept:
      'Access control decides who may enter a place or use a resource: identity is checked first, then permission is granted or denied.',
    components: [
      'User identity (card, fingerprint, password)',
      'Reader / authentication device',
      'Controller with the permission rules',
      'Lock, door or protected resource',
    ],
    flow: [
      'User presents an identity',
      'Reader verifies it',
      'Controller checks permission',
      'Access granted or denied, and the event is logged',
    ],
    relationships: [
      'Reader → controller: verified identity',
      'Controller → lock: open or stay closed',
      'Every attempt → log for audit',
    ],
    keywords: ['authenticate', 'permission', 'log', 'granted / denied'],
  },
  {
    id: 'embedded-system',
    match: /\b(embedded|real[\s-]*time|firmware)\b/i,
    concept:
      'An embedded system is a computer built inside a device to do one job reliably, usually reacting to sensors in real time.',
    components: [
      'Sensors and inputs',
      'Microcontroller running the firmware',
      'Actuators and outputs',
      'Power supply and communication interface',
    ],
    flow: [
      'Sense the environment',
      'Process according to the firmware',
      'Act through outputs',
      'Repeat within the required time limit',
    ],
    relationships: [
      'Sensor → controller: input value',
      'Controller → actuator: control signal',
      'Firmware decides everything the device can do',
    ],
    keywords: ['firmware', 'real time', 'dedicated function', 'low power'],
  },
  {
    id: 'iot-general',
    match: /\b(iot|internet of things|smart device|smart home)\b/i,
    concept:
      'An IoT system connects everyday devices to the internet so they can sense, report and be controlled remotely.',
    components: [
      'Things / devices with sensors',
      'Connectivity (Wi-Fi, cellular, gateway)',
      'Cloud platform that stores and processes data',
      'User app for monitoring and control',
    ],
    flow: [
      'Device senses something',
      'Data is sent over the network',
      'Cloud stores and analyses it',
      'User sees it and can send a command back',
    ],
    relationships: [
      'Device → cloud: measurements and events',
      'Cloud → device: control commands',
      'User → app: monitoring and decisions',
    ],
    keywords: ['sensor', 'connectivity', 'cloud', 'automation'],
  },
];

/** Words that carry no meaning on their own when extracting keywords. */
export const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'basic', 'by', 'concept', 'concepts', 'definition', 'for', 'from',
  'in', 'introduction', 'into', 'is', 'it', 'its', 'of', 'on', 'or', 'the', 'their', 'to', 'usage', 'use',
  'uses', 'using', 'what', 'with', 'vs', 'versus', 'types', 'type', 'kind', 'kinds', 'part', 'parts',
  'overview', 'notes', 'note', 'important', 'advantages', 'disadvantages', 'application', 'applications',
]);
