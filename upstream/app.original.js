// Bilibili Gift Dropper - Core Logic & Physics Engine

const DEFAULT_AVATARS = [
    // Cat
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#ffdd67" stroke="#ffffff" stroke-width="4"/>
        <polygon points="20,30 35,10 42,27" fill="#ffa834"/>
        <polygon points="80,30 65,10 58,27" fill="#ffa834"/>
        <ellipse cx="38" cy="45" rx="4" ry="6" fill="#000000"/>
        <ellipse cx="62" cy="45" rx="4" ry="6" fill="#000000"/>
        <path d="M 50 52 L 50 56 Q 47 59 44 57 M 50 56 Q 53 59 56 57" stroke="#000000" stroke-width="3" fill="none" stroke-linecap="round"/>
        <polygon points="48,50 52,50 50,53" fill="#ff6699"/>
        <path d="M 25 50 L 10 48 M 25 55 L 8 55 M 75 50 L 90 48 M 75 55 L 92 55" stroke="#ffa834" stroke-width="3" stroke-linecap="round"/>
     </svg>`,
    // Panda
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#ffffff" stroke="#e1e8ed" stroke-width="4"/>
        <circle cx="22" cy="22" r="14" fill="#292f33"/>
        <circle cx="78" cy="22" r="14" fill="#292f33"/>
        <ellipse cx="36" cy="48" rx="10" ry="14" transform="rotate(-15 36 48)" fill="#292f33"/>
        <ellipse cx="64" cy="48" rx="10" ry="14" transform="rotate(15 64 48)" fill="#292f33"/>
        <circle cx="38" cy="46" r="4" fill="#ffffff"/>
        <circle cx="62" cy="46" r="4" fill="#ffffff"/>
        <ellipse cx="50" cy="58" rx="6" ry="4" fill="#292f33"/>
        <path d="M 45 64 Q 50 67 55 64" stroke="#292f33" stroke-width="3" fill="none" stroke-linecap="round"/>
     </svg>`,
    // Jelly Slime
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#3b88fd" stroke="#ffffff" stroke-width="4"/>
        <circle cx="36" cy="45" r="4" fill="#ffffff"/>
        <circle cx="64" cy="45" r="4" fill="#ffffff"/>
        <path d="M 42 58 Q 50 66 58 58" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M 25 22 L 25 28 M 22 25 L 28 25" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        <path d="M 75 72 L 75 78 M 72 75 L 78 75" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
     </svg>`,
    // Shiba Fox
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" fill="#e87a30" stroke="#ffffff" stroke-width="4"/>
        <path d="M 15 65 C 25 50, 40 50, 50 60 C 60 50, 75 50, 85 65 C 75 85, 25 85, 15 65" fill="#ffffff"/>
        <ellipse cx="38" cy="38" rx="5" ry="3" fill="#ffffff" transform="rotate(-10 38 38)"/>
        <ellipse cx="62" cy="38" rx="5" ry="3" fill="#ffffff" transform="rotate(10 62 38)"/>
        <circle cx="36" cy="48" r="4" fill="#292f33"/>
        <circle cx="64" cy="48" r="4" fill="#292f33"/>
        <polygon points="47,56 53,56 50,59" fill="#292f33"/>
        <path d="M 46 62 Q 50 64 54 62" stroke="#292f33" stroke-width="2.5" fill="none" stroke-linecap="round"/>
     </svg>`
];

// App Configurations & State variables
const state = {
    isOverlay: false,
    giftType: '',            // Will default dynamically to first crawled gift ID
    idCode: '',              // Streamer Bilibili Open Platform Identity Code (身份码)
    roomId: '',              // Resolved Numeric Room ID
    testUsername: '猫咪不爱吃鱼',
    testAvatarUrl: '',
    
    // Global defaults (used when customization is disabled)
    defaults: {
        useAvatar: false,
        sizeScale: 1.0,
        dropCount: 15,
        gravity: 0.6,
        bounciness: 0.45,
        spin: 0.5,
        scatter: 0.6,
        behavior: 'settle',      // 'settle' or 'fall-out'
        restTime: 5.0            // in seconds
    },
    
    // Five group configurations
    groups: {
        group1: null,
        group2: null,
        group3: null,
        group4: null,
        group5: null
    },
    
    // Mapping unique gift names to their customization mode:
    // null (default) | 'custom' (independent settings) | 'group1' | 'group2' | 'group3' | 'group4' | 'group5'
    giftGroups: {},
    
    // Custom overrides per independent gift: giftName -> settings
    giftSettings: {},
    
    // Loaded lists
    crawledGifts: [],        // Loaded from gifts.json (unique names)
    rawGifts: []             // Raw list parsed from gifts.json (all entries)
};

// Canvas references
let canvas, ctx;
let particles = [];
let imageCache = {};         // Image path -> Image instance
let broadcastChannel;

// Bilibili Live WebSocket status and connection
let biliSocket = null;
let heartbeatInterval = null;
let reconnectTimeout = null;

// Setup Broadcast Channel for local cross-tab communication
function initBroadcast() {
    broadcastChannel = new BroadcastChannel('bilibili-gift-dropper');
    broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'trigger-drop') {
            console.log('Broadcast received: Triggering drop with parameters', event.data.params);
            triggerDrop(event.data.params);
        } else if (event.data && event.data.type === 'clear-canvas') {
            particles = [];
        }
    };
}

// Convert SVG string to data URI
function svgToDataUri(svgString) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
}

// Pre-create image elements for defaults
function preloadDefaultAssets() {
    // Default Avatars
    DEFAULT_AVATARS.forEach((svg, index) => {
        const img = new Image();
        img.src = svgToDataUri(svg);
        imageCache[`default_avatar_${index}`] = img;
    });
}

// Resolve Chinese/English name for a gift ID key
function getGiftName(giftKey) {
    if (!giftKey || giftKey === 'random') return 'random';
    if (giftKey.startsWith('crawled_')) {
        const id = giftKey.replace('crawled_', '');
        const gift = state.rawGifts.find(g => String(g.id) === id);
        return gift ? gift.name : giftKey;
    }
    return giftKey;
}

// Resolve active settings group for a specific gift
function getActiveSettings(giftType) {
    const name = getGiftName(giftType);
    const mode = state.giftGroups[name];
    
    if (mode === 'group1') {
        return state.groups.group1 || state.defaults;
    } else if (mode === 'group2') {
        return state.groups.group2 || state.defaults;
    } else if (mode === 'group3') {
        return state.groups.group3 || state.defaults;
    } else if (mode === 'group4') {
        return state.groups.group4 || state.defaults;
    } else if (mode === 'group5') {
        return state.groups.group5 || state.defaults;
    } else if (mode === 'custom') {
        return state.giftSettings[name] || state.defaults;
    }
    return state.defaults;
}

// Helper to update a setting property
function updateSetting(prop, value) {
    const name = getGiftName(state.giftType);
    const mode = state.giftGroups[name] || 'default';
    
    if (mode === 'custom') {
        if (!state.giftSettings[name]) {
            state.giftSettings[name] = { useCustom: true, ...state.defaults };
        }
        state.giftSettings[name][prop] = value;
    } else if (mode === 'group1') {
        if (!state.groups.group1) {
            state.groups.group1 = { ...state.defaults };
        }
        state.groups.group1[prop] = value;
    } else if (mode === 'group2') {
        if (!state.groups.group2) {
            state.groups.group2 = { ...state.defaults };
        }
        state.groups.group2[prop] = value;
    } else if (mode === 'group3') {
        if (!state.groups.group3) {
            state.groups.group3 = { ...state.defaults };
        }
        state.groups.group3[prop] = value;
    } else if (mode === 'group4') {
        if (!state.groups.group4) {
            state.groups.group4 = { ...state.defaults };
        }
        state.groups.group4[prop] = value;
    } else if (mode === 'group5') {
        if (!state.groups.group5) {
            state.groups.group5 = { ...state.defaults };
        }
        state.groups.group5[prop] = value;
    } else {
        state.defaults[prop] = value;
    }
    generateObsUrl();
}

// Serialize settings profiles to a compact string format
function serializeGroupSettings(groupObj) {
    if (!groupObj) return '';
    const params = [];
    const paramMap = [
        { short: 'c', prop: 'dropCount' },
        { short: 's', prop: 'sizeScale' },
        { short: 'g', prop: 'gravity' },
        { short: 'b', prop: 'bounciness' },
        { short: 'sp', prop: 'spin' },
        { short: 'sc', prop: 'scatter' },
        { short: 'be', prop: 'behavior' },
        { short: 'r', prop: 'restTime' },
        { short: 'a', prop: 'useAvatar' }
    ];
    paramMap.forEach(item => {
        if (groupObj[item.prop] !== undefined) {
            let val = groupObj[item.prop];
            if (typeof val === 'boolean') val = val ? '1' : '0';
            params.push(`${item.short}=${val}`);
        }
    });
    return params.join(',');
}

function parseGroupSettingsString(str) {
    if (!str) return null;
    const settings = {};
    const paramMap = {
        c: { prop: 'dropCount', parse: parseInt },
        s: { prop: 'sizeScale', parse: parseFloat },
        g: { prop: 'gravity', parse: parseFloat },
        b: { prop: 'bounciness', parse: parseFloat },
        sp: { prop: 'spin', parse: parseFloat },
        sc: { prop: 'scatter', parse: parseFloat },
        be: { prop: 'behavior', parse: String },
        r: { prop: 'restTime', parse: parseFloat },
        a: { prop: 'useAvatar', parse: (val) => val === 'true' || val === '1' }
    };
    str.split(',').forEach(param => {
        const kv = param.split('=');
        if (kv.length !== 2) return;
        const shortName = kv[0];
        const val = kv[1];
        const rule = paramMap[shortName];
        if (rule) {
            settings[rule.prop] = rule.parse(val);
        }
    });
    return settings;
}

// Serialize gift settings overrides to a compact query string format
function serializeCustomSettings() {
    const parts = [];
    for (const [giftKey, settings] of Object.entries(state.giftSettings)) {
        if (!settings.useCustom) continue;
        
        const params = [];
        const paramMap = [
            { short: 'c', prop: 'dropCount' },
            { short: 's', prop: 'sizeScale' },
            { short: 'g', prop: 'gravity' },
            { short: 'b', prop: 'bounciness' },
            { short: 'sp', prop: 'spin' },
            { short: 'sc', prop: 'scatter' },
            { short: 'be', prop: 'behavior' },
            { short: 'r', prop: 'restTime' },
            { short: 'a', prop: 'useAvatar' }
        ];
        
        paramMap.forEach(item => {
            if (settings[item.prop] !== undefined) {
                let val = settings[item.prop];
                if (typeof val === 'boolean') val = val ? '1' : '0';
                params.push(`${item.short}=${val}`);
            }
        });
        
        // Escape gift key (name) to ensure safety in query string parameters
        parts.push(`${encodeURIComponent(giftKey)}:${params.join(',')}`);
    }
    return parts.join('|');
}

// Parse compact query string back into state.giftSettings overrides
function parseCustomSettingsString(str) {
    if (!str) return;
    const gifts = str.split('|');
    gifts.forEach(giftStr => {
        const parts = giftStr.split(':');
        if (parts.length < 2) return;
        const giftKey = decodeURIComponent(parts[0]);
        const paramsStr = parts[1];
        
        const settings = { useCustom: true };
        const paramMap = {
            c: { prop: 'dropCount', parse: parseInt },
            s: { prop: 'sizeScale', parse: parseFloat },
            g: { prop: 'gravity', parse: parseFloat },
            b: { prop: 'bounciness', parse: parseFloat },
            sp: { prop: 'spin', parse: parseFloat },
            sc: { prop: 'scatter', parse: parseFloat },
            be: { prop: 'behavior', parse: String },
            r: { prop: 'restTime', parse: parseFloat },
            a: { prop: 'useAvatar', parse: (val) => val === 'true' || val === '1' }
        };
        
        paramsStr.split(',').forEach(param => {
            const kv = param.split('=');
            if (kv.length !== 2) return;
            const shortName = kv[0];
            const val = kv[1];
            
            const rule = paramMap[shortName];
            if (rule) {
                settings[rule.prop] = rule.parse(val);
            }
        });
        
        state.giftSettings[giftKey] = settings;
    });
}

// Sync current settings values to visual sliders and options in control panel
function syncSettingsToUi() {
    const settings = getActiveSettings(state.giftType);
    const name = getGiftName(state.giftType);
    const mode = state.giftGroups[name] || 'default';
    
    document.getElementById('custom-mode-select').value = mode;
    
    document.getElementById('gift-select').value = state.giftType;
    document.getElementById('use-avatar').checked = settings.useAvatar;
    document.getElementById('size-scale').value = settings.sizeScale;
    document.getElementById('drop-count').value = settings.dropCount;
    document.getElementById('gravity').value = settings.gravity;
    document.getElementById('bounciness').value = settings.bounciness;
    document.getElementById('spin').value = settings.spin;
    document.getElementById('scatter').value = settings.scatter;
    document.getElementById('behavior-select').value = settings.behavior;
    document.getElementById('rest-time').value = settings.restTime;
    
    document.getElementById('test-username').value = state.testUsername;
    document.getElementById('test-avatar-url').value = state.testAvatarUrl;
    
    updateSliderLabels();
    toggleAvatarInputRow();
    toggleRestTimeRow();
}

// Parse Query Parameters from OBS Source URL
function parseQueryParams() {
    const params = new URLSearchParams(window.location.search);
    
    const mode = params.get('mode');
    if (mode === 'overlay') {
        state.isOverlay = true;
    }
    
    if (params.has('gift')) state.giftType = params.get('gift');
    if (params.has('idCode')) state.idCode = params.get('idCode');
    
    // Parse defaults
    if (params.has('avatar')) state.defaults.useAvatar = params.get('avatar') === 'true';
    if (params.has('size')) state.defaults.sizeScale = parseFloat(params.get('size')) || 1.0;
    if (params.has('count')) state.defaults.dropCount = parseInt(params.get('count'), 10) || 15;
    if (params.has('gravity')) state.defaults.gravity = parseFloat(params.get('gravity')) || 0.6;
    if (params.has('bounce')) state.defaults.bounciness = parseFloat(params.get('bounce')) || 0.45;
    if (params.has('spin')) state.defaults.spin = parseFloat(params.get('spin')) || 0.5;
    if (params.has('scatter')) state.defaults.scatter = parseFloat(params.get('scatter')) || 0.6;
    if (params.has('behavior')) state.defaults.behavior = params.get('behavior');
    if (params.has('stay')) state.defaults.restTime = parseFloat(params.get('stay')) || 5.0;
    
    if (params.has('username')) state.testUsername = params.get('username');
    if (params.has('avatarUrl')) state.testAvatarUrl = params.get('avatarUrl');
    
    // Parse groups profiles
    if (params.has('g1')) state.groups.group1 = parseGroupSettingsString(params.get('g1'));
    if (params.has('g2')) state.groups.group2 = parseGroupSettingsString(params.get('g2'));
    if (params.has('g3')) state.groups.group3 = parseGroupSettingsString(params.get('g3'));
    if (params.has('g4')) state.groups.group4 = parseGroupSettingsString(params.get('g4'));
    if (params.has('g5')) state.groups.group5 = parseGroupSettingsString(params.get('g5'));
    
    // Parse gift groups mappings
    if (params.has('gg')) {
        params.get('gg').split('|').forEach(part => {
            const kv = part.split(':');
            if (kv.length === 2) {
                state.giftGroups[decodeURIComponent(kv[0])] = kv[1];
            }
        });
    }
    
    // Parse custom overrides
    if (params.has('custom')) {
        parseCustomSettingsString(params.get('custom'));
    }
    
    // Sync to UI elements if we are in settings/dashboard mode
    if (!state.isOverlay) {
        syncSettingsToUi();
    } else {
        // Toggle view containers
        document.getElementById('app-container').className = 'overlay-mode';
        
        // If trigger is set to true on load
        if (params.get('trigger') === 'true') {
            setTimeout(() => {
                triggerDrop();
            }, 500);
        }
    }
}

// Update slider visual values in settings panel
function updateSliderLabels() {
    const settings = getActiveSettings(state.giftType);
    
    document.getElementById('drop-count-val').innerText = settings.dropCount;
    document.getElementById('size-scale-val').innerText = settings.sizeScale.toFixed(1) + 'x';
    document.getElementById('gravity-val').innerText = settings.gravity.toFixed(2);
    document.getElementById('bounciness-val').innerText = settings.bounciness.toFixed(2);
    document.getElementById('spin-val').innerText = settings.spin.toFixed(2);
    document.getElementById('scatter-val').innerText = settings.scatter.toFixed(2);
    document.getElementById('rest-time-val').innerText = settings.restTime + 's';
}

function toggleAvatarInputRow() {
    const settings = getActiveSettings(state.giftType);
    const row = document.getElementById('avatar-url-group');
    row.style.display = settings.useAvatar ? 'flex' : 'none';
}

function toggleRestTimeRow() {
    const settings = getActiveSettings(state.giftType);
    const row = document.getElementById('rest-time-group');
    row.style.display = settings.behavior === 'settle' ? 'flex' : 'none';
}

// Generate the final URL to be pasted in OBS
function generateObsUrl() {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    params.set('mode', 'overlay');
    params.set('gift', state.giftType);
    params.set('idCode', state.idCode);
    
    // Set global defaults in URL
    params.set('avatar', state.defaults.useAvatar);
    params.set('size', state.defaults.sizeScale);
    params.set('count', state.defaults.dropCount);
    params.set('gravity', state.defaults.gravity);
    params.set('bounce', state.defaults.bounciness);
    params.set('spin', state.defaults.spin);
    params.set('scatter', state.defaults.scatter);
    params.set('behavior', state.defaults.behavior);
    params.set('stay', state.defaults.restTime);
    
    if (state.defaults.useAvatar && state.testAvatarUrl) {
        params.set('avatarUrl', state.testAvatarUrl);
    }
    
    // Set groups profiles
    const g1Str = serializeGroupSettings(state.groups.group1);
    if (g1Str) params.set('g1', g1Str);
    
    const g2Str = serializeGroupSettings(state.groups.group2);
    if (g2Str) params.set('g2', g2Str);
    
    const g3Str = serializeGroupSettings(state.groups.group3);
    if (g3Str) params.set('g3', g3Str);
    
    const g4Str = serializeGroupSettings(state.groups.group4);
    if (g4Str) params.set('g4', g4Str);
    
    const g5Str = serializeGroupSettings(state.groups.group5);
    if (g5Str) params.set('g5', g5Str);
    
    // Set gift groups mapping
    const ggParts = [];
    for (const [name, mode] of Object.entries(state.giftGroups)) {
        if (mode) {
            ggParts.push(`${encodeURIComponent(name)}:${mode}`);
        }
    }
    if (ggParts.length > 0) {
        params.set('gg', ggParts.join('|'));
    }
    
    // Set customized overrides string
    const customStr = serializeCustomSettings();
    if (customStr) {
        params.set('custom', customStr);
    }
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    const urlInput = document.getElementById('obs-url');
    if (urlInput) {
        urlInput.value = fullUrl;
    }
}

// Load external gifts list
async function loadCrawledGifts() {
    try {
        const response = await fetch('gifts.json');
        if (!response.ok) return;
        
        const gifts = await response.json();
        
        // Cache all crawled images (including duplicates) so triggerDrop lookup never fails
        gifts.forEach(gift => {
            const img = new Image();
            img.src = gift.image;
            imageCache[`crawled_${gift.id}`] = img;
        });

        // Store complete raw list for name resolution
        state.rawGifts = gifts;
        
        // Sort gifts by price ascending (cheaper first)
        gifts.sort((a, b) => a.price - b.price);
        
        // De-duplicate by name to prevent duplicate entries in UI
        const uniqueGifts = [];
        const seenNames = new Set();
        gifts.forEach(gift => {
            if (!seenNames.has(gift.name)) {
                seenNames.add(gift.name);
                uniqueGifts.push(gift);
            }
        });
        state.crawledGifts = uniqueGifts;
        
        const select = document.getElementById('gift-select');
        select.innerHTML = ''; // Clear loading state
        
        // Add random option
        const randomOption = document.createElement('option');
        randomOption.value = 'random';
        randomOption.innerText = 'Random Gifts (随机赠送)';
        select.appendChild(randomOption);

        uniqueGifts.forEach(gift => {
            const option = document.createElement('option');
            option.value = `crawled_${gift.id}`;
            option.innerText = `${gift.name} (¥${(gift.price/1000).toFixed(1)})`;
            select.appendChild(option);
        });
        
        // Auto-select first crawled gift if current config is empty or invalid
        if (uniqueGifts.length > 0) {
            const isValidGift = state.giftType === 'random' || uniqueGifts.some(g => `crawled_${g.id}` === state.giftType);
            if (!isValidGift) {
                state.giftType = `crawled_${uniqueGifts[0].id}`;
            }
            select.value = state.giftType;
        }
        
        // Dynamic labels to mark custom configurations with stars
        updateDropdownLabels();
        
        console.log(`Loaded ${uniqueGifts.length} unique crawled gifts successfully.`);
    } catch (e) {
        console.log("No custom gifts.json found or failed to parse.", e);
        const select = document.getElementById('gift-select');
        if (select) {
            select.innerHTML = '<option disabled>Run fetch_gifts.js to load official Bilibili list</option>';
        }
    }
}

// Copy URL to Clipboard
function copyToClipboard() {
    const urlField = document.getElementById('obs-url');
    urlField.select();
    urlField.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(urlField.value).then(() => {
        const toast = document.getElementById('toast');
        toast.innerText = 'OBS URL Copied to Clipboard!';
        toast.className = ''; // remove hidden class
        setTimeout(() => {
            toast.className = 'toast-hidden';
        }, 2000);
    }).catch(err => {
        alert('Failed to copy link. Please manually copy the input box.');
    });
}

// Canvas size handling
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

// Physics Engine: Gift Particle definition
class GiftParticle {
    constructor(x, y, image, username, isAvatar, customParams = {}) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.username = username || '';
        this.isAvatar = isAvatar || false;
        
        // Use customParams directly since they are already fully resolved by triggerDrop
        const settings = { ...state.defaults, ...customParams };
        
        const sizeScale = settings.sizeScale !== undefined ? settings.sizeScale : 1.0;
        const gravityMultiplier = settings.gravity !== undefined ? settings.gravity : 0.6;
        const bouncinessVal = settings.bounciness !== undefined ? settings.bounciness : 0.45;
        const spinForce = settings.spin !== undefined ? settings.spin : 0.5;
        const restTimeVal = settings.restTime !== undefined ? settings.restTime : 5.0;
        const behaviorVal = settings.behavior !== undefined ? settings.behavior : 'settle';
        
        this.size = (Math.random() * 16 + 48) * sizeScale; // Base size: 48-64px, multiplied by size scale
        
        // Horizontal spawn speed scatter
        this.vx = (Math.random() - 0.5) * 6;
        // Vertical spawn speed (downwards)
        this.vy = Math.random() * 4 + 2; 
        
        this.gravity = gravityMultiplier * 0.4;
        this.bounciness = bouncinessVal;
        
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 0.2 * spinForce;
        
        this.opacity = 1.0;
        this.isResting = false;
        
        // Rest fade timers
        this.restDuration = restTimeVal * 1000; // convert to ms
        this.restStart = null;
        
        // Boundary behavior
        this.behavior = behaviorVal;
    }

    update(deltaTime) {
        if (this.isResting) {
            // Support check: verify if this particle is resting on the floor or on another resting particle below it
            let supported = false;
            const halfSize = this.size / 2;
            const floorLevel = canvas.height - halfSize;
            
            if (this.y >= floorLevel - 2) {
                // Supported directly by the floor
                supported = true;
            } else {
                // Check if supported by another resting particle below it
                for (let i = 0; i < particles.length; i++) {
                    const other = particles[i];
                    if (other === this || !other.isResting) continue;
                    
                    const dx = this.x - other.x;
                    const dy = this.y - other.y;
                    const distSq = dx * dx + dy * dy;
                    const minDist = halfSize + (other.size / 2);
                    
                    // Colliding, and 'other' is below 'this' (dy > 0 means other has a larger y position)
                    if (distSq < minDist * minDist * 1.05 && dy > 0) {
                        supported = true;
                        break;
                    }
                }
            }
            
            if (!supported) {
                // No longer supported (e.g. underlying particle faded out). Start falling again!
                this.isResting = false;
                this.restStart = null; // reset timer so it starts fresh when it lands again
            } else {
                // Still resting: apply friction and check the stay duration timer
                this.vx *= Math.pow(0.8, deltaTime);
                this.vy = 0;
                this.angularVelocity = 0;
                
                if (!this.restStart) {
                    this.restStart = Date.now();
                } else if (Date.now() - this.restStart > this.restDuration) {
                    // Snappy fade out (takes ~0.8s to fade completely at 60fps)
                    this.opacity -= 0.02 * deltaTime;
                    if (this.opacity <= 0) {
                        this.opacity = 0;
                    }
                }
                return;
            }
        }

        // Apply forces
        this.vy += this.gravity;
        
        // Apply rolling friction/air resistance
        this.vx *= Math.pow(0.98, deltaTime);
        this.angularVelocity *= Math.pow(0.95, deltaTime);

        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.angularVelocity;

        const halfSize = this.size / 2;

        // Collision bounds (Left / Right Walls)
        if (this.x - halfSize < 0) {
            this.x = halfSize;
            this.vx = -this.vx * 0.6; // Loss of energy on bounce
        } else if (this.x + halfSize > canvas.width) {
            this.x = canvas.width - halfSize;
            this.vx = -this.vx * 0.6;
        }

        // Stacking collision with other RESTING gifts
        if (this.behavior === 'settle') {
            for (let i = 0; i < particles.length; i++) {
                const other = particles[i];
                if (other === this || !other.isResting) continue;

                // Simple circular collision check
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                const distSq = dx * dx + dy * dy;
                const minDist = halfSize + (other.size / 2);

                if (distSq < minDist * minDist) {
                    const dist = Math.sqrt(distSq) || 0.001;
                    const overlap = minDist - dist;
                    
                    // Collision normal vector (pointing from other to this)
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Push this particle out of the other particle
                    this.x += nx * overlap;
                    this.y += ny * overlap;

                    // Bounce velocity off the other particle
                    const vn = this.vx * nx + this.vy * ny;
                    if (vn < 0) {
                        const impulse = -vn * (1 + this.bounciness);
                        this.vx += nx * impulse;
                        this.vy += ny * impulse;
                        
                        // Transfer speed to rotation
                        this.angularVelocity += (this.vx * ny - this.vy * nx) * 0.05;
                    }

                    // Settle check: if we are landing on top of the other particle (normal pointing mostly up)
                    // and velocity is very low, make it rest
                    if (ny < -0.6 && Math.abs(this.vy) < 0.8 && Math.abs(this.vx) < 0.8) {
                        this.vx = 0;
                        this.vy = 0;
                        this.angularVelocity = 0;
                        this.isResting = true;
                        break;
                    }
                }
            }
        }

        // Floor collision
        if (this.behavior === 'settle') {
            const floorLevel = canvas.height - halfSize;
            if (this.y >= floorLevel) {
                this.y = floorLevel;
                
                // If velocity is high, bounce, else settle
                if (Math.abs(this.vy) > 1.2) {
                    this.vy = -this.vy * this.bounciness;
                    this.vx *= 0.8; // slide resistance on ground bounce
                } else {
                    this.vy = 0;
                    this.vx = 0;
                    this.angularVelocity = 0;
                    this.isResting = true;
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        
        // Draw rotational transform
        ctx.rotate(this.angle);

        const halfSize = this.size / 2;
        
        if (this.isAvatar) {
            // Render beautiful circular avatar with dynamic borders
            ctx.beginPath();
            ctx.arc(0, 0, halfSize, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            
            // Draw picture
            try {
                if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
                    ctx.drawImage(this.image, -halfSize, -halfSize, this.size, this.size);
                } else {
                    // Draw dummy fallback shape
                    ctx.fillStyle = '#00a1d6';
                    ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
                }
            } catch (e) {
                ctx.fillStyle = '#ff6699';
                ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
            }
            
            // Draw a shiny pink/blue circular border on top of clip
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            
            ctx.beginPath();
            ctx.arc(0, 0, halfSize, 0, Math.PI * 2, true);
            ctx.strokeStyle = '#ff6699';
            ctx.lineWidth = 3;
            ctx.stroke();
            
        } else {
            // Draw standard gift image
            if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
                ctx.drawImage(this.image, -halfSize, -halfSize, this.size, this.size);
            }
        }

        ctx.restore();

        // Draw username label beneath the gift/avatar (Optional & Premium touch)
        if (this.username && this.opacity > 0.1) {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            
            // Text stroke for legibility in transparent OBS overlay
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 3.5;
            ctx.strokeText(this.username, this.x, this.y + this.size / 2 + 15);
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.username, this.x, this.y + this.size / 2 + 15);
            ctx.restore();
        }
    }
}

// Function to trigger a shower of gifts
async function triggerDrop(customParams = {}) {
    const giftVal = customParams.giftType !== undefined ? customParams.giftType : state.giftType;
    
    // Resolve active settings group for this gift
    const settings = getActiveSettings(giftVal);
    
    // Merge customParams if we are running a test drop with custom parameters (from BroadcastChannel)
    const activeSettings = { ...settings, ...customParams };
    
    // Capture actual gift count sent in stream (default to 1)
    const giftCount = customParams.giftCount !== undefined ? parseInt(customParams.giftCount, 10) : 1;
    
    // Scale total drop quantity by actual gift count
    let count = activeSettings.dropCount * giftCount;
    
    // Safety performance limit to prevent browser/OBS source crash on huge combos
    const MAX_ICONS_LIMIT = 150;
    if (count > MAX_ICONS_LIMIT) {
        count = MAX_ICONS_LIMIT;
    }
    
    const isAvatar = activeSettings.useAvatar;
    const username = customParams.testUsername !== undefined ? customParams.testUsername : state.testUsername;
    
    // Choose appropriate image
    let dropImage;
    
    if (isAvatar) {
        const customUrl = customParams.testAvatarUrl !== undefined ? customParams.testAvatarUrl : state.testAvatarUrl;
        if (customUrl) {
            // Load custom avatar url
            dropImage = new Image();
            dropImage.crossOrigin = 'anonymous'; // request CORS permission
            dropImage.src = customUrl;
        } else {
            // Pick a random built-in cute vector avatar
            const randomIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);
            dropImage = imageCache[`default_avatar_${randomIndex}`];
        }
    } else {
        if (giftVal === 'random') {
            // Pick a random crawled gift
            if (state.crawledGifts.length > 0) {
                const randomGift = state.crawledGifts[Math.floor(Math.random() * state.crawledGifts.length)];
                dropImage = imageCache[`crawled_${randomGift.id}`];
            }
        } else if (giftVal.startsWith('crawled_')) {
            dropImage = imageCache[giftVal];
        } else {
            // Fallback to first crawled gift if invalid
            if (state.crawledGifts.length > 0) {
                dropImage = imageCache[`crawled_${state.crawledGifts[0].id}`];
            }
        }
    }

    const scatterWidth = activeSettings.scatter;
    
    // Spawn loops
    for (let i = 0; i < count; i++) {
        // Stagger spawn times slightly for a "raining" feel
        setTimeout(() => {
            // Determine coordinate limits based on scatter width
            const scatterPx = canvas.width * scatterWidth;
            const minX = (canvas.width - scatterPx) / 2;
            const spawnX = minX + Math.random() * scatterPx;
            const spawnY = -60; // Spawn just above top bounds
            
            // Randomize images if set to random defaults
            let particleImage = dropImage;
            if (!isAvatar && giftVal === 'random' && state.crawledGifts.length > 0) {
                const randomGift = state.crawledGifts[Math.floor(Math.random() * state.crawledGifts.length)];
                particleImage = imageCache[`crawled_${randomGift.id}`];
            }

            const p = new GiftParticle(spawnX, spawnY, particleImage, username, isAvatar, activeSettings);
            particles.push(p);
        }, i * Math.random() * 80); // Stagger spawning 0-80ms apart
    }
}

// Physics & Frame Tick Loop
let lastTime = 0;
function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 16.666; // Normalise delta around 1 (for 60FPS)
    lastTime = timestamp;

    // Clear transparent canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(delta);
        p.draw(ctx);

        // Remove out-of-bounds or fully faded particles
        const halfSize = p.size / 2;
        if (p.opacity <= 0) {
            particles.splice(i, 1);
        } else if (p.behavior === 'fall-out' && p.y - halfSize > canvas.height) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(loop);
}

// Update option labels in the gift dropdown to display a tag if customized or grouped
function updateDropdownLabels() {
    const select = document.getElementById('gift-select');
    if (!select) return;
    
    Array.from(select.options).forEach(option => {
        const giftKey = option.value;
        if (giftKey === 'random') return;
        
        let name = option.getAttribute('data-raw-name');
        if (!name) {
            name = option.innerText;
            const lastParen = name.lastIndexOf(' (¥');
            if (lastParen !== -1) {
                name = name.substring(0, lastParen);
            }
            if (name.startsWith('⭐ ')) name = name.substring(2);
            if (name.startsWith('[G1] ')) name = name.substring(5);
            if (name.startsWith('[G2] ')) name = name.substring(5);
            if (name.startsWith('[G3] ')) name = name.substring(5);
            if (name.startsWith('[G4] ')) name = name.substring(5);
            if (name.startsWith('[G5] ')) name = name.substring(5);
            option.setAttribute('data-raw-name', name);
        }
        
        const gift = state.rawGifts.find(g => `crawled_${g.id}` === giftKey);
        const priceStr = gift ? ` (¥${(gift.price/1000).toFixed(1)})` : '';
        
        const mode = state.giftGroups[name];
        if (mode === 'custom') {
            option.innerText = `⭐ ${name}${priceStr}`;
        } else if (mode === 'group1') {
            option.innerText = `[G1] ${name}${priceStr}`;
        } else if (mode === 'group2') {
            option.innerText = `[G2] ${name}${priceStr}`;
        } else if (mode === 'group3') {
            option.innerText = `[G3] ${name}${priceStr}`;
        } else if (mode === 'group4') {
            option.innerText = `[G4] ${name}${priceStr}`;
        } else if (mode === 'group5') {
            option.innerText = `[G5] ${name}${priceStr}`;
        } else {
            option.innerText = `${name}${priceStr}`;
        }
    });
}

// Render checkable list of Bilibili gifts in the bulk group edit panel
function renderBulkGiftsList() {
    const listDiv = document.getElementById('bulk-gifts-list');
    if (!listDiv) return;
    
    const filterText = document.getElementById('bulk-search').value.trim().toLowerCase();
    listDiv.innerHTML = '';
    
    const selectAllCheckbox = document.getElementById('bulk-select-all');
    
    state.crawledGifts.forEach(gift => {
        if (filterText && !gift.name.toLowerCase().includes(filterText)) {
            return;
        }
        
        const giftKey = `crawled_${gift.id}`;
        const mode = state.giftGroups[gift.name];
        
        let prefix = '';
        if (mode === 'custom') prefix = '⭐ ';
        else if (mode === 'group1') prefix = '[G1] ';
        else if (mode === 'group2') prefix = '[G2] ';
        else if (mode === 'group3') prefix = '[G3] ';
        else if (mode === 'group4') prefix = '[G4] ';
        else if (mode === 'group5') prefix = '[G5] ';
        
        const itemLabel = document.createElement('label');
        itemLabel.className = 'bulk-gift-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'bulk-checkbox';
        checkbox.value = giftKey;
        checkbox.checked = selectAllCheckbox.checked;
        
        checkbox.addEventListener('change', updateBulkSelectedCount);
        
        const labelText = document.createElement('span');
        labelText.innerText = `${prefix}${gift.name} (¥${(gift.price/1000).toFixed(1)})`;
        
        itemLabel.appendChild(checkbox);
        itemLabel.appendChild(labelText);
        listDiv.appendChild(itemLabel);
    });
    
    updateBulkSelectedCount();
}

// Update the badge count of selected bulk edit checkboxes
function updateBulkSelectedCount() {
    const checkedBoxes = document.querySelectorAll('.bulk-checkbox:checked');
    const badge = document.getElementById('bulk-selected-count');
    if (badge) {
        badge.innerText = `${checkedBoxes.length} selected`;
    }
}

// Real-time Bilibili Open Platform WebSocket connection
function connectBilibiliWebsocket(idCode) {
    // Clean up existing connections
    if (biliSocket) {
        biliSocket.close();
        biliSocket = null;
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    const statusDiv = document.getElementById('ws-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #faad14;"></span> Negotiating Bilibili Open App session...`;
    }

    console.log(`[WS] Authenticating Bilibili Identity Code: ${idCode}`);
    
    // Start game app session via local server signature proxy
    fetch(`http://localhost:8000/get_danmu_info?idCode=${idCode}`)
        .then(response => {
            if (!response.ok) throw new Error('CORS proxy start request failed');
            return response.json();
        })
        .then(async (data) => {
            if (!data.success) throw new Error(data.error || 'Server rejected credentials');
            
            const realRoomId = data.room_id;
            const authBody = data.auth_body;
            const wssLinks = data.wss_link;
            
            console.log(`[WS] Bilibili resolved roomId: ${realRoomId}`);
            
            // Save resolved room ID dynamically
            state.roomId = String(realRoomId);
            
            // Check if we need to reload the room's custom gifts
            if (!state.isOverlay) {
                try {
                    statusDiv.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #faad14;"></span> Fetching official room gifts...`;
                    const crawlRes = await fetch(`http://localhost:8000/fetch_gifts?roomId=${realRoomId}`);
                    if (crawlRes.ok) {
                        await loadCrawledGifts();
                        syncSettingsToUi();
                        generateObsUrl();
                    }
                } catch (err) {
                    console.warn('[WS] Failed to reload room gifts database:', err);
                }
            }
            
            // Connect WebSocket
            const wsUrl = wssLinks && wssLinks.length > 0 ? wssLinks[0] : 'wss://opts-lv-colink.biliapi.com/sub';
            console.log(`[WS] Connecting to Bilibili node: ${wsUrl}`);
            
            biliSocket = new WebSocket(wsUrl);
            biliSocket.binaryType = 'arraybuffer';
            
            biliSocket.onopen = () => {
                console.log(`[WS] Websocket open! Sending handshake auth packet.`);
                
                // Send Op 7 handshake payload
                const authPacket = makeAuthPacket(authBody);
                biliSocket.send(authPacket);
                
                if (statusDiv) {
                    statusDiv.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #52c41a; box-shadow: 0 0 8px #52c41a;"></span> Live Room Linked (Connected)`;
                }
                
                // Keep-alive heartbeat packet every 30s
                heartbeatInterval = setInterval(() => {
                    if (biliSocket && biliSocket.readyState === WebSocket.OPEN) {
                        sendHeartbeat(biliSocket);
                    }
                }, 30000);
            };
            
            biliSocket.onmessage = (event) => {
                if (!(event.data instanceof ArrayBuffer)) return;
                
                const packets = decodePacket(event.data);
                packets.forEach(packet => {
                    if (packet.operation === 5 && packet.body) {
                        const msg = packet.body;
                        
                        // Parse Bilibili Open Platform events (LIVE_OPEN_PLATFORM_SEND_GIFT)
                        if (msg.cmd === 'LIVE_OPEN_PLATFORM_SEND_GIFT' && msg.data) {
                            const data = msg.data;
                            const giftName = data.gift_name;
                            const giftNum = data.gift_num;
                            const username = data.uname;
                            const avatarUrl = data.uface; // uface for open platform
                            
                            console.log(`[BiliWS] Live Open Platform Gift: ${username} sent ${giftNum}x ${giftName}`);
                            
                            // Check if avatar url is protocol-relative
                            let resolvedAvatar = avatarUrl;
                            if (resolvedAvatar && resolvedAvatar.startsWith('//')) {
                                resolvedAvatar = 'https:' + resolvedAvatar;
                            }
                            
                            // Map gift name back to technical ID
                            let giftKey = 'random';
                            if (state.rawGifts) {
                                const match = state.rawGifts.find(g => g.name === giftName);
                                if (match) {
                                    giftKey = `crawled_${match.id}`;
                                }
                            }
                            
                            // Trigger particle drop in overlay
                            triggerDrop({
                                giftType: giftKey,
                                giftCount: giftNum,
                                testUsername: username,
                                testAvatarUrl: resolvedAvatar
                            });
                        }
                    }
                });
            };
            
            biliSocket.onerror = (err) => {
                console.error('[WS] Connection error:', err);
            };
            
            biliSocket.onclose = () => {
                console.log('[WS] Connection closed. Reconnecting in 5s...');
                if (statusDiv) {
                    statusDiv.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ff4d4f;"></span> Connection Closed. Reconnecting...`;
                }
                reconnectTimeout = setTimeout(() => {
                    connectBilibiliWebsocket(idCode);
                }, 5000);
            };
        })
        .catch(err => {
            console.error('[WS] Connection negotiation failed:', err);
            if (statusDiv) {
                statusDiv.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ff4d4f;"></span> Connection Offline (Run run.py server)`;
            }
            reconnectTimeout = setTimeout(() => {
                connectBilibiliWebsocket(idCode);
            }, 10000);
        });
}

// Bilibili WS Protocol Helpers
function sendHeartbeat(ws) {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setInt32(0, 16);      // Packet len
    view.setInt16(4, 16);      // Header len
    view.setInt16(6, 1);       // Protocol version
    view.setInt32(8, 2);       // Operation (Heartbeat)
    view.setInt32(12, 1);      // Sequence
    ws.send(buffer);
}

function makeAuthPacket(authBodyString) {
    const encoder = new TextEncoder();
    const bodyBytes = encoder.encode(authBodyString);
    const packetLen = 16 + bodyBytes.byteLength;
    
    const buffer = new ArrayBuffer(packetLen);
    const view = new DataView(buffer);
    view.setInt32(0, packetLen);
    view.setInt16(4, 16);      // Header len (16)
    view.setInt16(6, 1);       // Protocol version (1)
    view.setInt32(8, 7);       // Operation (Auth)
    view.setInt32(12, 1);      // Sequence (1)
    
    const bodyArray = new Uint8Array(buffer, 16);
    bodyArray.set(bodyBytes);
    
    return buffer;
}

function decodePacket(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    const decoder = new TextDecoder('utf-8');
    const packets = [];
    
    let offset = 0;
    while (offset < arrayBuffer.byteLength) {
        if (offset + 16 > arrayBuffer.byteLength) break;
        
        const packetLen = dataView.getInt32(offset);
        const headerLen = dataView.getInt16(offset + 4);
        const protover = dataView.getInt16(offset + 6);
        const operation = dataView.getInt32(offset + 8);
        
        if (offset + packetLen > arrayBuffer.byteLength) break;
        
        const bodyBytes = new Uint8Array(arrayBuffer, offset + headerLen, packetLen - headerLen);
        
        if (operation === 5) {
            // Message notification payload
            if (protover === 0 || protover === 1) {
                try {
                    const text = decoder.decode(bodyBytes);
                    const json = JSON.parse(text);
                    packets.push({ operation, protover, body: json });
                } catch (e) {
                    console.error('[WS] Failed to parse JSON message frame:', e);
                }
            }
        }
        
        offset += packetLen;
    }
    return packets;
}

// Attach control panel event listeners
function setupEventListeners() {
    // 1. Gift Selector changes
    document.getElementById('gift-select').addEventListener('change', (e) => {
        state.giftType = e.target.value;
        syncSettingsToUi();
        generateObsUrl();
    });
    
    // Custom settings dropdown selection change
    document.getElementById('custom-mode-select').addEventListener('change', (e) => {
        const mode = e.target.value; // 'default' | 'custom' | 'group1' | ... | 'group5'
        const name = getGiftName(state.giftType);
        
        if (name) {
            if (mode === 'default') {
                state.giftGroups[name] = null;
            } else if (mode === 'custom') {
                state.giftGroups[name] = 'custom';
                // Clone current settings if empty
                if (!state.giftSettings[name]) {
                    state.giftSettings[name] = { useCustom: true, ...state.defaults };
                }
            } else if (mode === 'group1') {
                state.giftGroups[name] = 'group1';
                if (!state.groups.group1) state.groups.group1 = { ...state.defaults };
            } else if (mode === 'group2') {
                state.giftGroups[name] = 'group2';
                if (!state.groups.group2) state.groups.group2 = { ...state.defaults };
            } else if (mode === 'group3') {
                state.giftGroups[name] = 'group3';
                if (!state.groups.group3) state.groups.group3 = { ...state.defaults };
            } else if (mode === 'group4') {
                state.giftGroups[name] = 'group4';
                if (!state.groups.group4) state.groups.group4 = { ...state.defaults };
            } else if (mode === 'group5') {
                state.giftGroups[name] = 'group5';
                if (!state.groups.group5) state.groups.group5 = { ...state.defaults };
            }
        }
        updateDropdownLabels();
        syncSettingsToUi();
        generateObsUrl();
    });

    // 2. Bulk Group Settings Modal Listeners
    const bulkToggle = document.getElementById('btn-bulk-toggle');
    const bulkModal = document.getElementById('bulk-modal');
    const modalClose = document.getElementById('btn-modal-close');
    
    // Close Modal helper
    function closeModal() {
        bulkModal.className = 'modal-hidden';
    }

    bulkToggle.addEventListener('click', () => {
        bulkModal.className = ''; // Open Modal
        document.getElementById('bulk-search').value = ''; // clear search
        document.getElementById('bulk-select-all').checked = false; // clear select all
        renderBulkGiftsList();
    });

    modalClose.addEventListener('click', closeModal);
    
    bulkModal.addEventListener('click', (e) => {
        if (e.target === bulkModal) {
            closeModal();
        }
    });

    document.getElementById('bulk-search').addEventListener('input', renderBulkGiftsList);

    document.getElementById('bulk-select-all').addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.bulk-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
        });
        updateBulkSelectedCount();
    });

    // Helper for bulk group assignment
    function applyBulkGroup(groupKey) {
        const checkedBoxes = document.querySelectorAll('.bulk-checkbox:checked');
        if (checkedBoxes.length === 0) {
            alert('Please select at least one gift.');
            return;
        }

        const currentSettings = getActiveSettings(state.giftType);
        if (!state.groups[groupKey]) {
            state.groups[groupKey] = { ...currentSettings };
        }

        checkedBoxes.forEach(cb => {
            const giftKey = cb.value;
            const name = getGiftName(giftKey);
            state.giftGroups[name] = groupKey;
        });

        updateDropdownLabels();
        syncSettingsToUi();
        generateObsUrl();
        closeModal();

        // Show toast confirmation
        const toast = document.getElementById('toast');
        const groupNum = groupKey.replace('group', '');
        toast.innerText = `Linked ${checkedBoxes.length} gifts to Group ${groupNum}!`;
        toast.className = '';
        setTimeout(() => {
            toast.className = 'toast-hidden';
            toast.innerText = 'OBS URL Copied to Clipboard!';
        }, 2500);
    }

    // Attach Bulk link buttons listeners
    document.getElementById('btn-bulk-group1').addEventListener('click', () => applyBulkGroup('group1'));
    document.getElementById('btn-bulk-group2').addEventListener('click', () => applyBulkGroup('group2'));
    document.getElementById('btn-bulk-group3').addEventListener('click', () => applyBulkGroup('group3'));
    document.getElementById('btn-bulk-group4').addEventListener('click', () => applyBulkGroup('group4'));
    document.getElementById('btn-bulk-group5').addEventListener('click', () => applyBulkGroup('group5'));

    // Bulk action: Make visible checked items custom independent
    document.getElementById('btn-bulk-custom').addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('.bulk-checkbox:checked');
        if (checkedBoxes.length === 0) {
            alert('Please select at least one gift.');
            return;
        }

        const currentSettings = getActiveSettings(state.giftType);

        checkedBoxes.forEach(cb => {
            const giftKey = cb.value;
            const name = getGiftName(giftKey);
            state.giftGroups[name] = 'custom';
            state.giftSettings[name] = {
                useCustom: true,
                useAvatar: currentSettings.useAvatar,
                sizeScale: currentSettings.sizeScale,
                dropCount: currentSettings.dropCount,
                gravity: currentSettings.gravity,
                bounciness: currentSettings.bounciness,
                spin: currentSettings.spin,
                scatter: currentSettings.scatter,
                behavior: currentSettings.behavior,
                restTime: currentSettings.restTime
            };
        });

        updateDropdownLabels();
        syncSettingsToUi();
        generateObsUrl();
        closeModal();

        // Show toast confirmation
        const toast = document.getElementById('toast');
        toast.innerText = `Made ${checkedBoxes.length} gifts independent!`;
        toast.className = '';
        setTimeout(() => {
            toast.className = 'toast-hidden';
            toast.innerText = 'OBS URL Copied to Clipboard!';
        }, 2500);
    });

    // Bulk action: Reset visible checked items to global default
    document.getElementById('btn-bulk-reset').addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('.bulk-checkbox:checked');
        if (checkedBoxes.length === 0) {
            alert('Please select at least one gift to reset.');
            return;
        }

        checkedBoxes.forEach(cb => {
            const giftKey = cb.value;
            const name = getGiftName(giftKey);
            state.giftGroups[name] = null;
        });

        updateDropdownLabels();
        syncSettingsToUi();
        generateObsUrl();
        closeModal();

        // Show toast confirmation
        const toast = document.getElementById('toast');
        toast.innerText = `Reset ${checkedBoxes.length} gifts to defaults!`;
        toast.className = '';
        setTimeout(() => {
            toast.className = 'toast-hidden';
            toast.innerText = 'OBS URL Copied to Clipboard!';
        }, 2500);
    });

    // Identity Code inputs & fetch handler
    document.getElementById('id-code').addEventListener('input', (e) => {
        state.idCode = e.target.value.trim();
        generateObsUrl();
    });

    const btnLink = document.getElementById('btn-link-room');
    btnLink.addEventListener('click', async () => {
        const idCode = document.getElementById('id-code').value.trim();
        if (!idCode) {
            alert('Please enter a valid Bilibili Streamer Identity Code (身份码).');
            return;
        }
        
        btnLink.disabled = true;
        btnLink.innerText = '⏳ Linking...';
        
        try {
            state.idCode = idCode;
            connectBilibiliWebsocket(idCode);
        } catch (e) {
            console.error('Link room failed:', e);
            alert('Failed to connect to local server. Make sure run.py is running.');
        } finally {
            btnLink.disabled = false;
            btnLink.innerText = '🔗 Link Room';
        }
    });

    document.getElementById('test-username').addEventListener('input', (e) => {
        state.testUsername = e.target.value;
        generateObsUrl();
    });

    document.getElementById('test-avatar-url').addEventListener('input', (e) => {
        state.testAvatarUrl = e.target.value;
        generateObsUrl();
    });

    // Map Sliders to correct settings
    const sliders = [
        { id: 'size-scale', prop: 'sizeScale', parse: parseFloat },
        { id: 'drop-count', prop: 'dropCount', parse: parseInt },
        { id: 'gravity', prop: 'gravity', parse: parseFloat },
        { id: 'bounciness', prop: 'bounciness', parse: parseFloat },
        { id: 'spin', prop: 'spin', parse: parseFloat },
        { id: 'scatter', prop: 'scatter', parse: parseFloat },
        { id: 'rest-time', prop: 'restTime', parse: parseFloat }
    ];

    sliders.forEach(slider => {
        document.getElementById(slider.id).addEventListener('input', (e) => {
            const val = slider.parse(e.target.value);
            updateSetting(slider.prop, val);
            updateSliderLabels();
        });
    });

    // 3. Test drop button
    document.getElementById('btn-test').addEventListener('click', () => {
        const giftCountVal = parseInt(document.getElementById('test-gift-count').value, 10) || 1;
        
        // Trigger local drop with the test count multiplier
        triggerDrop({ giftCount: giftCountVal });
        
        // Broadcast custom parameters for this drop
        if (broadcastChannel) {
            const settings = getActiveSettings(state.giftType);
            broadcastChannel.postMessage({
                type: 'trigger-drop',
                params: {
                    useCustom: true, // tell receiver it's a pre-customized drop list
                    giftType: state.giftType,
                    ...settings,
                    giftCount: giftCountVal,
                    testUsername: state.testUsername,
                    testAvatarUrl: state.testAvatarUrl
                }
            });
        }
    });

    document.getElementById('btn-clear').addEventListener('click', () => {
        particles = [];
        if (broadcastChannel) {
            broadcastChannel.postMessage({ type: 'clear-canvas' });
        }
    });

    document.getElementById('btn-copy').addEventListener('click', copyToClipboard);
}

// Load configuration from local storage if available
function loadSavedConfig() {
    const saved = localStorage.getItem('bili_gift_dropper_config');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.defaults) {
                state.defaults = { ...state.defaults, ...parsed.defaults };
            }
            if (parsed.groups) {
                state.groups = parsed.groups;
            }
            if (parsed.giftGroups) {
                state.giftGroups = parsed.giftGroups;
            }
            if (parsed.giftSettings) {
                state.giftSettings = parsed.giftSettings;
            }
            if (parsed.giftType) {
                state.giftType = parsed.giftType;
            }
            if (parsed.idCode) {
                state.idCode = parsed.idCode;
            }
            if (parsed.roomId) {
                state.roomId = parsed.roomId;
            }
            if (parsed.testUsername) {
                state.testUsername = parsed.testUsername;
            }
            if (parsed.testAvatarUrl) {
                state.testAvatarUrl = parsed.testAvatarUrl;
            }
        } catch (e) {
            console.log("Failed to load saved config from local storage, using defaults.");
        }
    }
}

// Keyboard shortcuts for quick debugging in simulator
window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        if (e.code === 'Space') {
            e.preventDefault();
            triggerDrop();
        } else if (e.code === 'KeyC') {
            particles = [];
        }
    }
});

// App Initialization
async function init() {
    canvas = document.getElementById('gift-canvas');
    ctx = canvas.getContext('2d');
    
    // Set listeners and resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    preloadDefaultAssets();
    loadSavedConfig();
    
    // Parse URL first (OBS Overlay will set state immediately)
    parseQueryParams();
    
    // If in Control Panel mode, load list of official gifts crawled in background
    if (!state.isOverlay) {
        document.getElementById('id-code').value = state.idCode || '';
        setupEventListeners();
        await loadCrawledGifts();
        
        // Sync everything to UI and generate OBS link with loaded settings
        syncSettingsToUi();
        generateObsUrl();
        
        // Connect control panel to Bilibili Open Platform WebSocket if Identity Code exists
        if (state.idCode) {
            connectBilibiliWebsocket(state.idCode);
        }
        
        // Save config when page is closed
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('bili_gift_dropper_config', JSON.stringify({
                defaults: state.defaults,
                groups: state.groups,
                giftGroups: state.giftGroups,
                giftSettings: state.giftSettings,
                giftType: state.giftType,
                idCode: state.idCode,
                roomId: state.roomId,
                testUsername: state.testUsername,
                testAvatarUrl: state.testAvatarUrl
            }));
        });
    } else {
        // If in OBS Overlay mode, load local gifts list first
        await loadCrawledGifts();
        
        if (state.idCode) {
            console.log(`[Overlay] Initializing Bilibili Open Platform WebSocket for ID Code: ${state.idCode}`);
            connectBilibiliWebsocket(state.idCode);
        }
    }
    
    // Open Broadcast Channels
    initBroadcast();

    // Start rendering loops
    requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', init);
