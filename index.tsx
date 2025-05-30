
// Ensure vis and marked are available globally if not using ES6 imports for them directly
// For this setup, they are loaded via CDN in index.html, so they should be on the window object.
declare var marked: any; // marked

// fix: Define interfaces for vis-network components to enable strong typing
interface LoreEntry {
    id?: string | number; // Optional: can be explicitly set or implicitly be array index
    key: string;
    comment: string;
    content: string;
    // Removed unused optional properties: mode, insertorder, alwaysActive, secondkey, selective, useRegex, bookVersion
    [otherProperty: string]: any;
}

interface VisNode {
    id: string | number;
    label?: string;
    title?: string;
    originalData?: LoreEntry;
    fixed?: boolean | { x: boolean; y: boolean };
    x?: number;
    y?: number;
    color?: string | { background?: string; border?: string; highlight?: { background?: string; border?: string }; hover?: { background?: string; border?: string } };
    opacity?: number;
    font?: { size?: number; color?: string };
    shape?: string;
    size?: number;
    widthConstraint?: { minimum?: number; maximum?: number } | number;
    heightConstraint?: { minimum?: number; maximum?: number } | number;
}

interface VisEdge {
    id: string | number;
    from: string | number;
    to: string | number;
    arrows?: string | { to?: { enabled?: boolean; type?: string } };
    color?: string | { color?: string; highlight?: string; hover?: string; inherit?: boolean | string; opacity?: number };
    smooth?: boolean | { enabled?: boolean; type?: string; roundness?: number };
    opacity?: number;
    width?: number; // Added width for controlling edge visibility
}

// Interface for the vis.DataSet constructor
interface VisDataSetConstructor {
    new <T extends { id: string | number }>(
        data?: T[],
        options?: { fieldId?: 'id' | (string & {}), queue?: boolean | object }
    ): VisDataSet<T>;
}

// Interface for the vis.DataSet instance
interface VisDataSet<T extends { id: string | number }> {
    add(data: T | T[], senderId?: string | number): (T['id'])[];
    clear(senderId?: string | number): (T['id'])[];

    // fix: Replaced single ambiguous 'get' signature with specific overloads
    // 1. Get all items (no arguments)
    get(): T[];
    // 2. Get single item by ID (can have options)
    get(id: T['id'], options?: { fields?: (keyof T | string)[]; type?: any; returnType?: string }): T | null;
    // 3. Get multiple items by array of IDs (can have options)
    get(ids: (T['id'])[], options?: { fields?: (keyof T | string)[]; type?: any; returnType?: string }): T[];
    // 4. Get items using an options object (e.g., for filtering, or getting all with specific fields)
    get(options: { filter?: (item: T) => boolean; fields?: (keyof T | string)[]; type?: any; returnType?: string; order?: string | ((a: T, b: T) => number); }): T[];

    getIds(options?: { filter?: (item: T) => boolean; order?: string | ((a: T, b: T) => number) }): (T['id'])[];
    remove(id: T['id'] | (T['id'])[] | { filter: (item: T) => boolean }, senderId?: string | number): (T['id'])[];
    update(data: (Partial<T> & { id: T['id'] }) | (Partial<T> & { id: T['id'] })[], senderId?: string | number): (T['id'])[];
    // Consider adding other methods like map, forEach, length if widely used and need specific typing.
}

// Interface for the vis.Network constructor
interface VisNetworkConstructor {
    new (
        container: HTMLElement,
        data: { nodes: VisDataSet<VisNode>, edges: VisDataSet<VisEdge> },
        options: any
    ): VisNetworkInstance;
}

// Interface for the vis.Network instance
interface VisNetworkInstance {
    destroy(): void;
    fit(options?: any): void;
    getScale(): number;
    moveTo(options: any): void;
    on(event: string, callback: (params?: any) => void): void;
    once(event: string, callback: (params?: any) => void): void;
    selectNodes(nodeIds: (string | number)[], highlightEdges?: boolean): void;
    setOptions(options: any): void;
    setSize(width: string, height: string): void;
    unselectAll(): void;
    getConnectedEdges(nodeId: string | number): (string | number)[];
    DOMtoCanvas(position: {x: number, y: number}): {x: number, y: number}; // Add DOMtoCanvas
}

declare var vis: {
    DataSet: VisDataSetConstructor;
    Network: VisNetworkConstructor;
};


// fix: Use specific VisNetworkInstance type for network
let network: VisNetworkInstance | null = null;
let allData: LoreEntry[] = [];
// fix: Use specific VisNode and VisEdge types for DataSets, removing incorrect second generic parameter
let nodesDataSet = new vis.DataSet<VisNode>([]);
let edgesDataSet = new vis.DataSet<VisEdge>([]);

// State for selected items and dirty data
let currentSelectedIds: { nodes: (string | number)[], edges: (string | number)[] } = { nodes: [], edges: [] };
let isDataDirty: boolean = false;
let appResizeObserver: ResizeObserver | null = null;

// State for detail panels
let activeNodeIdLeft: string | number | null = null;
let originalDataLeft: LoreEntry | null = null;
let activeNodeIdRight: string | number | null = null;
let originalDataRight: LoreEntry | null = null;

// State for node placement - REMOVED
// let isPlacingNode: boolean = false;
// let nodeIdToPlace: string | number | null = null;


// DOM Elements - General Controls
let graphContainer: HTMLElement;
let fileInput: HTMLInputElement;
let fileNameDisplay: HTMLSpanElement;
let exportButton: HTMLButtonElement;
let resetViewButton: HTMLButtonElement;
let zoomInButton: HTMLButtonElement;
let zoomOutButton: HTMLButtonElement;
let nodeShapeSelector: HTMLSelectElement;
let nodeSizeSlider: HTMLInputElement;
let textSizeSlider: HTMLInputElement;
let dimUnconnectedToggle: HTMLInputElement;
let grayscaleToggle: HTMLInputElement;
let fixNodesToggle: HTMLInputElement;
let hideArrowsToggle: HTMLInputElement;
let disablePhysicsToggle: HTMLInputElement; // New toggle for disabling physics
let graphPlaceholder: HTMLElement | null;

// DOM Elements - Custom Color Palettes
let nodeColorDisplay: HTMLElement;
let nodeColorPaletteContainer: HTMLElement;
let textColorDisplay: HTMLElement;
let textColorPaletteContainer: HTMLElement;

// DOM Elements - Node List Panel
let nodeListPanelContainer: HTMLElement;
let nodeListHeader: HTMLElement;
let nodeListElement: HTMLUListElement;
let draggedListItem: HTMLElement | null = null;


// DOM Elements - Details Panels Overlay and Individual Panels
let detailsOverlayContainer: HTMLElement;

// Left Panel Elements
let nodeDetailsPanelLeft: HTMLElement;
let closeDetailsButtonLeft: HTMLButtonElement;
let keyInputLeft: HTMLTextAreaElement;
let copyKeyButtonLeft: HTMLButtonElement;
let commentInputLeft: HTMLTextAreaElement;
let copyCommentButtonLeft: HTMLButtonElement;
let contentInputLeft: HTMLTextAreaElement;
let copyContentButtonLeft: HTMLButtonElement;
let markdownPreviewLeft: HTMLElement;
let saveDetailsButtonLeft: HTMLButtonElement;
// let placeNodeButton: HTMLButtonElement; // REMOVED: button for placing node

// Right Panel Elements
let nodeDetailsPanelRight: HTMLElement;
let closeDetailsButtonRight: HTMLButtonElement;
let keyInputRight: HTMLTextAreaElement;
let copyKeyButtonRight: HTMLButtonElement;
let commentInputRight: HTMLTextAreaElement;
let copyCommentButtonRight: HTMLButtonElement;
let contentInputRight: HTMLTextAreaElement;
let copyContentButtonRight: HTMLButtonElement;
let markdownPreviewRight: HTMLElement;
let saveDetailsButtonRight: HTMLButtonElement;

const RAINBOW_COLORS = ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE', '#FFFFFF', '#000000'];

const defaultGraphOptions = {
    nodeShape: 'dot',
    nodeSize: 20,
    nodeColor: RAINBOW_COLORS[4], // Default to Blue
    nodeBorderColor: RAINBOW_COLORS[4], // Default to Blue
    nodeTextColor: '#FFFFFF', // Default to White
    nodeTextSize: 60, // Default to 60, matches new slider min
    edgeColor: '#848484',
    edgeWidth: 1, // Default edge width
};

let hideArrowsGlobally: boolean = false; // Global state for "Hide Arrows" toggle
let physicsEnabled: boolean = true; // Global state for "Disable Physics" toggle (true = physics ON)

const HIGHLIGHT_NODE_BG = '#D3E5FF';
const HIGHLIGHT_NODE_BORDER = '#2B7CE9';
const HIGHLIGHT_EDGE_COLOR = '#2B7CE9';
const DIMMED_OPACITY = 0.2;
const DEFAULT_OPACITY = 1.0;
const HIDDEN_EDGE_OPACITY = 0;
const HIDDEN_EDGE_WIDTH = 0;
const TRANSPARENT_COLOR = 'transparent';


function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const debounced = (...args: Parameters<F>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };
    return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

function getVisJsOptions() {
    const edgeBaseOptions: Partial<VisEdge> = {
        color: { color: defaultGraphOptions.edgeColor, highlight: HIGHLIGHT_EDGE_COLOR },
        arrows: 'to',
        width: defaultGraphOptions.edgeWidth,
    };

    const smoothOptions = physicsEnabled
        ? { enabled: true, type: 'dynamic', roundness: 0.5 }
        : { enabled: false, type: 'continuous' }; // Straight lines when physics is off

    const physicsConfig = physicsEnabled
        ? {
            solver: 'barnesHut',
            barnesHut: {
                gravitationalConstant: -12000,
                centralGravity: 0.6,
                springLength: 120,
                springConstant: 0.02,
                damping: 0.09,
                avoidOverlap: 0.3
            },
            minVelocity: 0.75,
            stabilization: { enabled: true, iterations: 1000, updateInterval: 50, fit: false }
          }
        : { enabled: false }; // Disable physics entirely

    const options: any = {
        nodes: {
            shape: defaultGraphOptions.nodeShape,
            size: defaultGraphOptions.nodeSize,
            font: { size: defaultGraphOptions.nodeTextSize, color: defaultGraphOptions.nodeTextColor },
            borderWidth: 2,
            color: {
                background: defaultGraphOptions.nodeColor,
                border: defaultGraphOptions.nodeBorderColor,
                highlight: { background: HIGHLIGHT_NODE_BG, border: HIGHLIGHT_NODE_BORDER },
            },
            opacity: DEFAULT_OPACITY,
        },
        edges: {
            ...edgeBaseOptions,
            smooth: smoothOptions,
        },
        physics: physicsConfig,
        interaction: { hover: true, tooltipDelay: 200, selectConnectedEdges: false },
        layout: { randomSeed: undefined, improvedLayout: true },
        autoResize: false,
    };
    return options;
}

function setupDropdownColorPalette(
    displayElement: HTMLElement,
    paletteContainer: HTMLElement,
    colors: string[],
    settingKey: 'nodeColor' | 'nodeTextColor',
    options: { updateBorder?: boolean } = {}
) {
    paletteContainer.innerHTML = ''; // Clear previous swatches
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        swatch.setAttribute('role', 'button');
        swatch.setAttribute('aria-label', `Select color ${color}`);
        swatch.tabIndex = 0;

        swatch.addEventListener('click', () => {
            if (settingKey === 'nodeColor') {
                defaultGraphOptions.nodeColor = color;
                if (options.updateBorder) {
                    defaultGraphOptions.nodeBorderColor = color;
                }
            } else if (settingKey === 'nodeTextColor') {
                defaultGraphOptions.nodeTextColor = color;
            }
            displayElement.style.backgroundColor = color;
            paletteContainer.classList.add('hidden');
            displayElement.setAttribute('aria-expanded', 'false');
            updateNodeAppearanceSettings();
        });
        swatch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                swatch.click();
            }
        });
        paletteContainer.appendChild(swatch);
    });

    displayElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click-outside from closing immediately
        const isHidden = paletteContainer.classList.toggle('hidden');
        displayElement.setAttribute('aria-expanded', String(!isHidden));
    });
    displayElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            displayElement.click();
        }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (!paletteContainer.classList.contains('hidden') && !paletteContainer.contains(e.target as Node) && !displayElement.contains(e.target as Node)) {
            paletteContainer.classList.add('hidden');
            displayElement.setAttribute('aria-expanded', 'false');
        }
    });
}


function initializeApp() {
    console.log("Initializing app...");
    graphContainer = document.getElementById('graphContainer') as HTMLElement;
    fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileNameDisplay = document.getElementById('fileNameDisplay') as HTMLSpanElement;
    exportButton = document.getElementById('exportButton') as HTMLButtonElement;
    resetViewButton = document.getElementById('resetViewButton') as HTMLButtonElement;
    zoomInButton = document.getElementById('zoomInButton') as HTMLButtonElement;
    zoomOutButton = document.getElementById('zoomOutButton') as HTMLButtonElement;
    nodeShapeSelector = document.getElementById('nodeShapeSelector') as HTMLSelectElement;
    nodeSizeSlider = document.getElementById('nodeSizeSlider') as HTMLInputElement;
    textSizeSlider = document.getElementById('textSizeSlider') as HTMLInputElement;
    dimUnconnectedToggle = document.getElementById('dimUnconnectedToggle') as HTMLInputElement;
    grayscaleToggle = document.getElementById('grayscaleToggle') as HTMLInputElement;
    fixNodesToggle = document.getElementById('fixNodesToggle') as HTMLInputElement;
    hideArrowsToggle = document.getElementById('hideArrowsToggle') as HTMLInputElement;
    disablePhysicsToggle = document.getElementById('disablePhysicsToggle') as HTMLInputElement;
    graphPlaceholder = graphContainer.querySelector('.placeholder-text');

    // Color Palette Elements
    nodeColorDisplay = document.getElementById('nodeColorDisplay') as HTMLElement;
    nodeColorPaletteContainer = document.getElementById('nodeColorPaletteContainer') as HTMLElement;
    textColorDisplay = document.getElementById('textColorDisplay') as HTMLElement;
    textColorPaletteContainer = document.getElementById('textColorPaletteContainer') as HTMLElement;

    nodeListPanelContainer = document.getElementById('nodeListPanelContainer') as HTMLElement;
    nodeListHeader = document.getElementById('nodeListHeader') as HTMLElement;
    nodeListElement = document.getElementById('nodeList') as HTMLUListElement;


    detailsOverlayContainer = document.getElementById('detailsOverlayContainer') as HTMLElement;

    // Left Panel
    nodeDetailsPanelLeft = document.getElementById('nodeDetailsPanelLeft') as HTMLElement;
    closeDetailsButtonLeft = document.getElementById('closeDetailsButtonLeft') as HTMLButtonElement;
    keyInputLeft = document.getElementById('keyInputLeft') as HTMLTextAreaElement;
    copyKeyButtonLeft = document.getElementById('copyKeyButtonLeft') as HTMLButtonElement;
    commentInputLeft = document.getElementById('commentInputLeft') as HTMLTextAreaElement;
    copyCommentButtonLeft = document.getElementById('copyCommentButtonLeft') as HTMLButtonElement;
    contentInputLeft = document.getElementById('contentInputLeft') as HTMLTextAreaElement;
    copyContentButtonLeft = document.getElementById('copyContentButtonLeft') as HTMLButtonElement;
    markdownPreviewLeft = document.getElementById('markdownPreviewLeft') as HTMLElement;
    saveDetailsButtonLeft = document.getElementById('saveDetailsButtonLeft') as HTMLButtonElement;
    // placeNodeButton = document.getElementById('placeNodeButton') as HTMLButtonElement; // REMOVED

    // Right Panel
    nodeDetailsPanelRight = document.getElementById('nodeDetailsPanelRight') as HTMLElement;
    closeDetailsButtonRight = document.getElementById('closeDetailsButtonRight') as HTMLButtonElement;
    keyInputRight = document.getElementById('keyInputRight') as HTMLTextAreaElement;
    copyKeyButtonRight = document.getElementById('copyKeyButtonRight') as HTMLButtonElement;
    commentInputRight = document.getElementById('commentInputRight') as HTMLTextAreaElement;
    copyCommentButtonRight = document.getElementById('copyCommentButtonRight') as HTMLButtonElement;
    contentInputRight = document.getElementById('contentInputRight') as HTMLTextAreaElement;
    copyContentButtonRight = document.getElementById('copyContentButtonRight') as HTMLButtonElement;
    markdownPreviewRight = document.getElementById('markdownPreviewRight') as HTMLElement;
    saveDetailsButtonRight = document.getElementById('saveDetailsButtonRight') as HTMLButtonElement;

    // Event Listeners - General
    fileInput.addEventListener('change', handleFileLoad);
    exportButton.addEventListener('click', exportData);
    resetViewButton.addEventListener('click', () => { network?.fit(); clearSelectionAndHighlights(); });
    zoomInButton.addEventListener('click', () => network?.moveTo({ scale: network.getScale() * 1.2 }));
    zoomOutButton.addEventListener('click', () => network?.moveTo({ scale: network.getScale() * 0.8 }));
    nodeShapeSelector.addEventListener('change', updateNodeShapeSetting);
    nodeSizeSlider.addEventListener('input', updateNodeAppearanceSettings);
    textSizeSlider.addEventListener('input', updateNodeAppearanceSettings);

    dimUnconnectedToggle.addEventListener('change', () => {
        if (currentSelectedIds.nodes.length > 0 || currentSelectedIds.edges.length > 0) {
            applyHighlightsAndDimming(currentSelectedIds.nodes, currentSelectedIds.edges);
        } else {
           clearCustomHighlightsAndDim();
        }
    });
    grayscaleToggle.addEventListener('change', toggleGrayscaleMode);
    fixNodesToggle.addEventListener('change', toggleFixNodes);

    hideArrowsToggle.addEventListener('change', () => {
        hideArrowsGlobally = hideArrowsToggle.checked;
        clearCustomHighlightsAndDim();
        if (currentSelectedIds.nodes.length > 0 || currentSelectedIds.edges.length > 0) {
            applyHighlightsAndDimming(currentSelectedIds.nodes, currentSelectedIds.edges);
        }
    });

    disablePhysicsToggle.addEventListener('change', () => {
        physicsEnabled = !disablePhysicsToggle.checked; // Checked = physics OFF
        if (network) {
            network.setOptions(getVisJsOptions());
        }
    });


    // Setup Color Palettes
    setupDropdownColorPalette(nodeColorDisplay, nodeColorPaletteContainer, RAINBOW_COLORS, 'nodeColor', { updateBorder: true });
    setupDropdownColorPalette(textColorDisplay, textColorPaletteContainer, RAINBOW_COLORS, 'nodeTextColor');


    // Event Listeners - Node List
    nodeListHeader.addEventListener('click', toggleNodeListVisibility);


    // Event Listeners - Left Panel
    closeDetailsButtonLeft.addEventListener('click', () => handleClosePanel('left'));
    saveDetailsButtonLeft.addEventListener('click', () => savePanelChanges('left'));
    copyKeyButtonLeft.addEventListener('click', () => handleCopyField('key', 'left'));
    copyCommentButtonLeft.addEventListener('click', () => handleCopyField('comment', 'left'));
    copyContentButtonLeft.addEventListener('click', () => handleCopyField('content', 'left'));
    contentInputLeft.addEventListener('input', () => {
        if (activeNodeIdLeft !== null) markdownPreviewLeft.innerHTML = marked.parse(contentInputLeft.value);
    });
    // placeNodeButton.addEventListener('click', handlePlaceNodeStart); // REMOVED


    // Event Listeners - Right Panel
    closeDetailsButtonRight.addEventListener('click', () => handleClosePanel('right'));
    saveDetailsButtonRight.addEventListener('click', () => savePanelChanges('right'));
    copyKeyButtonRight.addEventListener('click', () => handleCopyField('key', 'right'));
    copyCommentButtonRight.addEventListener('click', () => handleCopyField('comment', 'right'));
    copyContentButtonRight.addEventListener('click', () => handleCopyField('content', 'right'));
    contentInputRight.addEventListener('input', () => {
        if (activeNodeIdRight !== null) markdownPreviewRight.innerHTML = marked.parse(contentInputRight.value);
    });


    // Initialize UI states
    nodeShapeSelector.value = defaultGraphOptions.nodeShape;
    nodeSizeSlider.value = String(defaultGraphOptions.nodeSize);
    nodeColorDisplay.style.backgroundColor = defaultGraphOptions.nodeColor;
    textSizeSlider.value = String(defaultGraphOptions.nodeTextSize);
    textColorDisplay.style.backgroundColor = defaultGraphOptions.nodeTextColor;
    hideArrowsToggle.checked = hideArrowsGlobally;
    disablePhysicsToggle.checked = !physicsEnabled;

    fileNameDisplay.textContent = 'No file chosen';
    showDetailsOverlay(false, false);
    nodeListPanelContainer.classList.add('hidden');
    nodeListPanelContainer.classList.remove('expanded');


    if (typeof ResizeObserver !== 'undefined') {
        const debouncedResize = debounce(() => { if (network) network.setSize('100%', '100%'); }, 250);
        appResizeObserver = new ResizeObserver(entries => { if (entries && entries.length > 0) debouncedResize(); });
        appResizeObserver.observe(graphContainer);
    }

    renderGraph();
    console.log("App initialized.");
}

function showDetailsOverlay(showLeft: boolean, showRight: boolean) {
    if (!showLeft && !showRight) {
        detailsOverlayContainer.classList.add('hidden');
    } else {
        detailsOverlayContainer.classList.remove('hidden');
    }
    nodeDetailsPanelLeft.classList.toggle('hidden', !showLeft);
    nodeDetailsPanelRight.classList.toggle('hidden', !showRight);
}

function populatePanel(nodeId: string | number | null, panelSide: 'left' | 'right') {
    let keyInput: HTMLTextAreaElement, commentInput: HTMLTextAreaElement, contentInput: HTMLTextAreaElement, markdownPreview: HTMLElement;
    let currentOriginalData: LoreEntry | null = null;

    if (panelSide === 'left') {
        keyInput = keyInputLeft; commentInput = commentInputLeft; contentInput = contentInputLeft; markdownPreview = markdownPreviewLeft;
        activeNodeIdLeft = nodeId;
    } else {
        keyInput = keyInputRight; commentInput = commentInputRight; contentInput = contentInputRight; markdownPreview = markdownPreviewRight;
        activeNodeIdRight = nodeId;
    }

    if (nodeId === null) {
        keyInput.value = ""; commentInput.value = ""; contentInput.value = "";
        markdownPreview.innerHTML = "";
        if (panelSide === 'left') originalDataLeft = null; else originalDataRight = null;
        return;
    }

    const nodeFromDataSet = nodesDataSet.get(nodeId);
    if (nodeFromDataSet && nodeFromDataSet.originalData) {
        currentOriginalData = nodeFromDataSet.originalData;
        keyInput.value = currentOriginalData.key || "";
        commentInput.value = currentOriginalData.comment || "";
        contentInput.value = currentOriginalData.content || "";
        markdownPreview.innerHTML = marked.parse(currentOriginalData.content || "");
        if (panelSide === 'left') originalDataLeft = currentOriginalData; else originalDataRight = currentOriginalData;
    } else {
        // It might be a newly added node not yet fully synced with originalData in the VisNode if added directly to dataset
        // or if originalData was not properly set.
        const dataEntry = allData.find(entry => entry.id === nodeId || allData.indexOf(entry) === nodeId);
        if (dataEntry) {
            currentOriginalData = dataEntry;
            keyInput.value = currentOriginalData.key || "";
            commentInput.value = currentOriginalData.comment || "";
            contentInput.value = currentOriginalData.content || "";
            markdownPreview.innerHTML = marked.parse(currentOriginalData.content || "");
            if (panelSide === 'left') originalDataLeft = currentOriginalData; else originalDataRight = currentOriginalData;
        } else {
            keyInput.value = ""; commentInput.value = ""; contentInput.value = "";
            markdownPreview.innerHTML = "";
            if (panelSide === 'left') originalDataLeft = null; else originalDataRight = null;
            console.warn(`Node data not found for ID: ${nodeId} in panel ${panelSide}`);
        }
    }
}

async function handleClosePanel(panelSide: 'left' | 'right') {
    const originalData = panelSide === 'left' ? originalDataLeft : originalDataRight;
    const keyInput = panelSide === 'left' ? keyInputLeft : keyInputRight;
    const commentInput = panelSide === 'left' ? commentInputLeft : commentInputRight;
    const contentInput = panelSide === 'left' ? contentInputLeft : contentInputRight;

    if (originalData) {
        const keyChanged = keyInput.value !== (originalData.key || "");
        const commentChanged = commentInput.value !== (originalData.comment || "");
        const contentChanged = contentInput.value !== (originalData.content || "");

        if (keyChanged || commentChanged || contentChanged) {
            if (confirm("You have unsaved changes. Save them before closing?")) {
                await savePanelChanges(panelSide);
            }
        }
    }

    if (panelSide === 'left') {
        nodeDetailsPanelLeft.classList.add('hidden');
        activeNodeIdLeft = null; originalDataLeft = null;
    } else {
        nodeDetailsPanelRight.classList.add('hidden');
        activeNodeIdRight = null; originalDataRight = null;
    }

    if (nodeDetailsPanelLeft.classList.contains('hidden') && nodeDetailsPanelRight.classList.contains('hidden')) {
        detailsOverlayContainer.classList.add('hidden');
    }
}

async function savePanelChanges(panelSide: 'left' | 'right') {
    const activeNodeId = panelSide === 'left' ? activeNodeIdLeft : activeNodeIdRight;
    let originalDataRef = panelSide === 'left' ? originalDataLeft : originalDataRight; // This is a reference to an object in allData
    const keyInput = panelSide === 'left' ? keyInputLeft : keyInputRight;
    const commentInput = panelSide === 'left' ? commentInputLeft : commentInputRight;
    const contentInput = panelSide === 'left' ? contentInputLeft : contentInputRight;

    if (!activeNodeId || !originalDataRef) {
        console.warn(`No active node or original data for panel ${panelSide}, cannot save.`);
        return;
    }

    // Find the index of originalDataRef in allData to update the correct object
    // This assumes originalDataRef is a direct reference from allData.
    // If ID is reliable (e.g. after adding a node, its ID is set in LoreEntry)
    const dataIndex = allData.findIndex(item =>
        (item.id !== undefined && item.id === originalDataRef?.id) || // if LoreEntry has an id
        item === originalDataRef // fallback to object reference, or index if id isn't on LoreEntry
    );

    if (dataIndex < 0) {
         // If not found by reference or id, try by activeNodeId which should be the array index for existing/newly added nodes
        const potentialIndex = typeof activeNodeId === 'number' ? activeNodeId : parseInt(String(activeNodeId), 10);
        if (!isNaN(potentialIndex) && allData[potentialIndex]) {
            // This is a bit of a guess, assumes activeNodeId is the index
             // This should be reliable if activeNodeId is indeed the array index
            if (allData[potentialIndex].key === originalDataRef.key || allData.indexOf(originalDataRef) === potentialIndex) {
                // dataIndex = potentialIndex; // This logic path might be redundant if originalDataRef is always set correctly
            } else {
                 console.error("Critical error: Mismatch finding node's original data. Node ID:", activeNodeId, "Original Data Ref:", originalDataRef);
                 alert("Error: Could not save changes due to data inconsistency. Please try reloading or re-adding the node.");
                 return;
            }
        } else {
            console.error("Critical error: Cannot find selected node's original data in allData for saving. Node ID:", activeNodeId);
            alert("Error: Could not save changes due to data inconsistency. Please try reloading the data.");
            return;
        }
    }

    // Ensure we are updating the correct entry in allData
    // If originalDataRef was correctly fetched by index, it's already a reference to an item in allData.
    // So, updating originalDataRef directly modifies the item in allData.
    originalDataRef.key = keyInput.value;
    originalDataRef.comment = commentInput.value;
    originalDataRef.content = contentInput.value;
    // If originalDataRef.id was not set for new nodes, set it now.
    if (originalDataRef.id === undefined && typeof activeNodeId === 'number') {
        originalDataRef.id = activeNodeId;
    }


    let label = originalDataRef.comment?.trim();
    if (!label && originalDataRef.key?.trim()) label = originalDataRef.key.split(',')[0].trim();
    if (!label) label = `Untitled ${typeof activeNodeId === 'number' ? activeNodeId + 1 : activeNodeId}`;


    nodesDataSet.update({
        id: activeNodeId,
        label: label.length > 30 ? label.substring(0, 27) + '...' : label,
        title: (originalDataRef.comment || 'No Comment').replace(/</g, "&lt;").replace(/>/g, "&gt;"),
        originalData: originalDataRef // Ensure the visNode has the updated reference
    });

    populateNodeList();

    isDataDirty = true;
    console.log(`Node details saved for panel ${panelSide}. Data is dirty. ID:`, activeNodeId);
    // alert("Changes saved successfully!"); // Can be noisy, consider removing or making it more subtle
}

function handleCopyField(field: 'key' | 'comment' | 'content', panelSide: 'left' | 'right') {
    let inputElement: HTMLTextAreaElement;
    let buttonElement: HTMLButtonElement;

    if (panelSide === 'left') {
        if (field === 'key') { inputElement = keyInputLeft; buttonElement = copyKeyButtonLeft; }
        else if (field === 'comment') { inputElement = commentInputLeft; buttonElement = copyCommentButtonLeft; }
        else { inputElement = contentInputLeft; buttonElement = copyContentButtonLeft; }
    } else {
        if (field === 'key') { inputElement = keyInputRight; buttonElement = copyKeyButtonRight; }
        else if (field === 'comment') { inputElement = commentInputRight; buttonElement = copyCommentButtonRight; }
        else { inputElement = contentInputRight; buttonElement = copyContentButtonRight; }
    }

    const textToCopy = inputElement.value;
    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                const originalText = buttonElement.textContent;
                buttonElement.textContent = 'Copied!';
                setTimeout(() => { buttonElement.textContent = originalText; }, 1500);
            })
            .catch(err => {
                console.error(`Failed to copy ${field} from ${panelSide} panel: `, err);
                alert(`Failed to copy ${field}. See console for details.`);
            });
    }
}


function handleFileLoad(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.style.color = '#e0e0e0';
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (!content) {
                    alert("File is empty or could not be read.");
                    fileNameDisplay.textContent = 'Error reading file';
                    fileNameDisplay.style.color = '#ff6666';
                    return;
                }
                const parsedJson = JSON.parse(content);
                if (typeof parsedJson === 'object' && parsedJson !== null && Array.isArray(parsedJson.data)) {
                    allData = parsedJson.data.map((entry, index) => ({ ...entry, id: entry.id ?? index }));
                } else if (Array.isArray(parsedJson)) {
                    allData = parsedJson.map((entry, index) => ({ ...entry, id: entry.id ?? index }));
                } else {
                    alert("Invalid JSON format. Expected an array of entries or an object with a 'data' array.");
                    fileNameDisplay.textContent = 'Invalid JSON format';
                    fileNameDisplay.style.color = '#ff6666';
                    return;
                }
                isDataDirty = false;
                processDataAndRenderGraph();
            } catch (error) {
                console.error("Error parsing JSON file:", error);
                alert("Error parsing JSON file. Please ensure it's valid JSON.\n" + (error as Error).message);
                fileNameDisplay.textContent = 'Error parsing JSON';
                fileNameDisplay.style.color = '#ff6666';
            }
        };
        reader.onerror = (e) => {
            console.error("Error reading file:", e);
            alert("Error reading file.");
            fileNameDisplay.textContent = 'Error reading file';
            fileNameDisplay.style.color = '#ff6666';
        };
        reader.readAsText(file);
    } else {
        fileNameDisplay.textContent = 'No file chosen';
        fileNameDisplay.style.color = '#a0a0a0';
    }
}

function processDataAndRenderGraph() {
    console.log("Processing data and rendering graph...");
    clearSelectionAndHighlights();
    const newNodes: VisNode[] = [];
    const newEdges: VisEdge[] = [];

    // Ensure all entries in allData have an 'id' if they are to be used by vis.DataSet
    // This step is crucial if 'id' was not part of the original LoreEntry or if relying on index
    allData.forEach((entry, index) => {
        if (entry.id === undefined) {
            entry.id = index; // Assign index as ID if not present
        }
        let label = entry.comment?.trim();
        if (!label && entry.key?.trim()) label = entry.key.split(',')[0].trim();
        if (!label) label = `Untitled ${index + 1}`;

        const existingNode = nodesDataSet.get(entry.id);

        newNodes.push({
            id: entry.id,
            label: label.length > 30 ? label.substring(0, 27) + '...' : label,
            title: (entry.comment || 'No Comment').replace(/</g, "&lt;").replace(/>/g, "&gt;"),
            originalData: entry,
            fixed: existingNode?.fixed ?? { x: fixNodesToggle?.checked ?? false, y: fixNodesToggle?.checked ?? false },
            x: existingNode?.x, // Preserve position if node already existed (e.g., after placement)
            y: existingNode?.y,
        });
    });

    allData.forEach((sourceEntry) => {
        const sourceContent = sourceEntry.content?.toLowerCase() || "";
        if (!sourceContent || sourceEntry.id === undefined) return;

        allData.forEach((targetEntry) => {
            if (targetEntry.id === undefined || sourceEntry.id === targetEntry.id) return;

            const targetKeys = targetEntry.key?.split(',') || [];
            for (const rawKey of targetKeys) {
                const keyword = rawKey.trim().toLowerCase();
                if (keyword) {
                    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    const regex = new RegExp(`\\b${escapedKeyword}\\b`);
                    if (regex.test(sourceContent)) {
                        newEdges.push({ from: sourceEntry.id!, to: targetEntry.id!, id: `${sourceEntry.id}-${targetEntry.id}-${rawKey.trim()}` });
                        break;
                    }
                }
            }
        });
    });

    nodesDataSet.clear(); edgesDataSet.clear();
    nodesDataSet.add(newNodes); edgesDataSet.add(newEdges);

    if (graphPlaceholder) {
        graphPlaceholder.style.display = newNodes.length > 0 ? 'none' : 'block';
        graphPlaceholder.textContent = newNodes.length > 0 ? '' : 'No data to display. Load a JSON file.';
    }

    populateNodeList();
    renderGraph();

    if (hideArrowsGlobally) {
        clearCustomHighlightsAndDim();
    }
    console.log("Data processed and graph rendered.");
}

function renderGraph() {
    if (network) { network.destroy(); network = null; }
    const data = { nodes: nodesDataSet, edges: edgesDataSet };
    try {
        network = new vis.Network(graphContainer, data, getVisJsOptions());
        network.on('click', handleGraphClick);
        if (physicsEnabled) {
            network.once('stabilizationIterationsDone', () => {
                console.log("Stabilization iterations done, fitting network.");
                if (network) network.fit();
            });
        } else {
            if (network) network.fit();
        }
    } catch (error) {
        console.error("Error rendering graph:", error);
        if (graphPlaceholder) {
             graphPlaceholder.textContent = "Error rendering graph. See console for details.";
             graphPlaceholder.style.display = 'block';
        }
    }
}

function handleGraphClick(params: any) {
    // Node placement logic removed

    // Existing click logic for selection and opening panels
    clearCustomHighlightsAndDim();
    currentSelectedIds = { nodes: params.nodes, edges: params.edges };

    updateNodeListSelection(params.nodes.length > 0 ? params.nodes[0] : null);

    if (params.edges.length > 0) {
        const clickedEdgeId = params.edges[0];
        const edgeData = edgesDataSet.get(clickedEdgeId);
        if (edgeData && typeof edgeData.from !== 'undefined' && typeof edgeData.to !== 'undefined') {
            activeNodeIdLeft = edgeData.from;
            activeNodeIdRight = edgeData.to;
            populatePanel(activeNodeIdLeft, 'left');
            populatePanel(activeNodeIdRight, 'right');
            showDetailsOverlay(true, true);

            const { nodesToHighlight, edgesToHighlight } = getConnectedComponents(null, clickedEdgeId);
            applyHighlightsAndDimming(nodesToHighlight, edgesToHighlight);
            currentSelectedIds = { nodes: nodesToHighlight, edges: edgesToHighlight };
            updateNodeListSelection(nodesToHighlight);
        } else {
            clearSelectionAndHighlights();
        }
    } else if (params.nodes.length > 0) {
        activeNodeIdLeft = params.nodes[0];
        activeNodeIdRight = null;
        populatePanel(activeNodeIdLeft, 'left');
        populatePanel(null, 'right');
        showDetailsOverlay(true, false);

        const { nodesToHighlight, edgesToHighlight } = getConnectedComponents(activeNodeIdLeft, null);
        applyHighlightsAndDimming(nodesToHighlight, edgesToHighlight);
        currentSelectedIds = { nodes: nodesToHighlight, edges: edgesToHighlight };
    } else {
        clearSelectionAndHighlights();
    }
}

function getConnectedComponents(nodeId: string | number | null, edgeId: string | number | null): { nodesToHighlight: (string | number)[], edgesToHighlight: (string | number)[] } {
    let nodesToHighlight: (string | number)[] = [];
    let edgesToHighlight: (string | number)[] = [];

    if (nodeId !== null && network) {
        nodesToHighlight.push(nodeId);
        const connectedEdges = network.getConnectedEdges(nodeId);
        edgesToHighlight.push(...connectedEdges);
        connectedEdges.forEach((connEdgeId: string | number) => {
            const edge = edgesDataSet.get(connEdgeId);
            if (edge) {
                if (edge.from !== nodeId && !nodesToHighlight.includes(edge.from)) nodesToHighlight.push(edge.from);
                if (edge.to !== nodeId && !nodesToHighlight.includes(edge.to)) nodesToHighlight.push(edge.to);
            }
        });
    } else if (edgeId !== null) {
        const edge = edgesDataSet.get(edgeId);
        if (edge) {
            edgesToHighlight.push(edgeId);
            if (typeof edge.from !== 'undefined' && !nodesToHighlight.includes(edge.from)) nodesToHighlight.push(edge.from);
            if (typeof edge.to !== 'undefined' && !nodesToHighlight.includes(edge.to)) nodesToHighlight.push(edge.to);
        }
    }
    return { nodesToHighlight, edgesToHighlight };
}

function applyHighlightsAndDimming(nodesToHighlight: (string | number)[], edgesToHighlight: (string | number)[]) {
    const allNodeIds = nodesDataSet.getIds();
    const allEdgeIds = edgesDataSet.getIds();
    const nodeUpdates: (Partial<VisNode> & { id: string | number })[] = [];
    const edgeUpdates: (Partial<VisEdge> & { id: string | number })[] = [];
    const doDim = dimUnconnectedToggle.checked;

    const nodeBg = defaultGraphOptions.nodeColor;
    const nodeBorder = defaultGraphOptions.nodeBorderColor;
    const nodeTextClr = defaultGraphOptions.nodeTextColor;
    const edgeClr = defaultGraphOptions.edgeColor;

    allNodeIds.forEach(id => {
        if (nodesToHighlight.includes(id)) {
            nodeUpdates.push({ id: id, color: { background: HIGHLIGHT_NODE_BG, border: HIGHLIGHT_NODE_BORDER }, opacity: DEFAULT_OPACITY, font: { color: nodeTextClr }});
        } else {
            nodeUpdates.push({ id: id, color: { background: nodeBg, border: nodeBorder }, opacity: doDim ? DIMMED_OPACITY : DEFAULT_OPACITY, font: { color: nodeTextClr }});
        }
    });

    allEdgeIds.forEach(id => {
        const isHighlightedEdge = edgesToHighlight.includes(id);
        const edgeUpdate: Partial<VisEdge> & { id: string | number } = { id: id };

        if (isHighlightedEdge) {
            edgeUpdate.color = { color: HIGHLIGHT_EDGE_COLOR };
            edgeUpdate.opacity = DEFAULT_OPACITY;
            edgeUpdate.arrows = 'to';
            edgeUpdate.width = defaultGraphOptions.edgeWidth;
        } else {
            if (hideArrowsGlobally) {
                edgeUpdate.color = { color: TRANSPARENT_COLOR };
                edgeUpdate.opacity = HIDDEN_EDGE_OPACITY;
                edgeUpdate.arrows = { to: { enabled: false } };
                edgeUpdate.width = HIDDEN_EDGE_WIDTH;
            } else {
                edgeUpdate.color = { color: edgeClr };
                edgeUpdate.opacity = doDim ? DIMMED_OPACITY : DEFAULT_OPACITY;
                edgeUpdate.arrows = 'to';
                edgeUpdate.width = defaultGraphOptions.edgeWidth;
            }
        }
        edgeUpdates.push(edgeUpdate);
    });

    if (nodeUpdates.length > 0) nodesDataSet.update(nodeUpdates);
    if (edgeUpdates.length > 0) edgesDataSet.update(edgeUpdates);
}

function clearCustomHighlightsAndDim() {
    const nodeUpdates: (Partial<VisNode> & {id: string | number})[] = [];
    nodesDataSet.getIds().forEach(id => {
        const originalNode = nodesDataSet.get(id); // Get original node to preserve fixed status and position
        nodeUpdates.push({
            id: id,
            shape: defaultGraphOptions.nodeShape,
            size: defaultGraphOptions.nodeSize,
            color: { background: defaultGraphOptions.nodeColor, border: defaultGraphOptions.nodeBorderColor },
            opacity: DEFAULT_OPACITY,
            font: { size: defaultGraphOptions.nodeTextSize, color: defaultGraphOptions.nodeTextColor },
            fixed: originalNode?.fixed, // Preserve fixed state
            x: originalNode?.x, // Preserve x
            y: originalNode?.y  // Preserve y
        });
    });
    if (nodeUpdates.length > 0) nodesDataSet.update(nodeUpdates);

    const edgeUpdates: (Partial<VisEdge> & {id: string | number})[] = [];
    edgesDataSet.getIds().forEach(id => {
        if (hideArrowsGlobally) {
            edgeUpdates.push({
                id: id,
                color: { color: TRANSPARENT_COLOR },
                opacity: HIDDEN_EDGE_OPACITY,
                arrows: { to: { enabled: false } },
                width: HIDDEN_EDGE_WIDTH
            });
        } else {
            edgeUpdates.push({
                id: id,
                color: { color: defaultGraphOptions.edgeColor },
                opacity: DEFAULT_OPACITY,
                arrows: 'to',
                width: defaultGraphOptions.edgeWidth
            });
        }
    });
    if (edgeUpdates.length > 0) edgesDataSet.update(edgeUpdates);
}

function clearSelectionAndHighlights() {
    activeNodeIdLeft = null; originalDataLeft = null;
    activeNodeIdRight = null; originalDataRight = null;
    currentSelectedIds = { nodes: [], edges: [] };

    showDetailsOverlay(false, false);
    populatePanel(null, 'left');
    populatePanel(null, 'right');
    updateNodeListSelection(null);
    if (nodeListPanelContainer && !nodeListPanelContainer.classList.contains('hidden')) {
        // Removed commented-out lines for collapsing panel
    }

    clearCustomHighlightsAndDim();
    network?.unselectAll();
}

function updateNodeShapeSetting() {
    defaultGraphOptions.nodeShape = nodeShapeSelector.value;
    if (network) {
        network.setOptions(getVisJsOptions());
        clearCustomHighlightsAndDim();
        if (currentSelectedIds.nodes.length > 0 || currentSelectedIds.edges.length > 0) {
            applyHighlightsAndDimming(currentSelectedIds.nodes, currentSelectedIds.edges);
        }
    }
}

function toggleGrayscaleMode() {
    graphContainer.classList.toggle('grayscale-active', grayscaleToggle.checked);
}

function toggleFixNodes() {
    const isFixed = fixNodesToggle.checked;
    const nodeUpdates: (Partial<VisNode> & {id: string | number})[] = nodesDataSet.getIds().map(nodeId => ({ id: nodeId, fixed: { x: isFixed, y: isFixed } }));
    if (nodeUpdates.length > 0) nodesDataSet.update(nodeUpdates);
}

function updateNodeAppearanceSettings() {
    defaultGraphOptions.nodeSize = parseInt(nodeSizeSlider.value);
    defaultGraphOptions.nodeTextSize = parseInt(textSizeSlider.value);

    if (network) {
        network.setOptions(getVisJsOptions());
        clearCustomHighlightsAndDim();
        if (currentSelectedIds.nodes.length > 0 || currentSelectedIds.edges.length > 0) {
            applyHighlightsAndDimming(currentSelectedIds.nodes, currentSelectedIds.edges);
        }
    }
}

function exportData() {
    if (allData.length === 0) { alert("No data to export."); return; }
    // Removed unused 'exportableData' variable and associated comments.
    // The application exports 'allData' which includes any 'id' properties.
    const jsonData = JSON.stringify({ data: allData }, null, 2); // Exporting with current allData structure
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lorebook_export.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    isDataDirty = false;
    console.log("Data exported. Data is clean.");
    alert("Data exported successfully!");
}

// Node List Panel Functions
function populateNodeList() {
    if (!nodeListElement || !nodeListPanelContainer || !nodeListHeader) return;

    nodeListElement.innerHTML = '';
    const nodes = nodesDataSet.get({ fields: ['id', 'label'], order: 'label' });

    if (nodes.length === 0 && allData.length === 0) { // Only hide if truly no data from file or added
        nodeListPanelContainer.classList.add('hidden');
        return;
    }

    nodeListPanelContainer.classList.remove('hidden');
    // Removed commented-out lines for managing panel header arrow

    nodes.forEach(node => {
        const li = document.createElement('li');
        li.textContent = node.label || `Node ${node.id}`;
        li.dataset.nodeId = String(node.id);
        li.draggable = true;

        li.addEventListener('click', () => handleNodeListItemClick(node.id));
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);
        nodeListElement.appendChild(li);
    });
    updateNodeListSelection(activeNodeIdLeft);
}

function toggleNodeListVisibility() {
    if (nodeListPanelContainer && nodeListHeader) {
        const isExpanded = nodeListPanelContainer.classList.toggle('expanded');
        (nodeListHeader.querySelector('.toggle-arrow') as HTMLElement).textContent = isExpanded ? '▲' : '▼';
    }
}


function handleNodeListItemClick(nodeId: string | number) {
    if (network) {
        // network.selectNodes([nodeId]); // This might trigger another click event, handleGraphClick handles selection
    }
    const clickParams = { nodes: [nodeId], edges: [] };
    handleGraphClick(clickParams);
}

function updateNodeListSelection(selectedNodeIdsInput: (string | number) | (string | number)[] | null) {
    if (!nodeListElement) return;

    const items = nodeListElement.querySelectorAll('li');
    const idsToSelectSet = new Set<string>();

    if (selectedNodeIdsInput !== null) {
        const idsArray = Array.isArray(selectedNodeIdsInput) ? selectedNodeIdsInput : [selectedNodeIdsInput];
        idsArray.forEach(id => idsToSelectSet.add(String(id)));
    }

    items.forEach(item => {
        const itemId = item.dataset.nodeId;
        if (itemId && idsToSelectSet.has(itemId)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Drag and Drop for Node List (Visual Only)
function handleDragStart(event: DragEvent) {
    draggedListItem = event.target as HTMLElement;
    if (draggedListItem && event.dataTransfer) {
        event.dataTransfer.setData('text/plain', draggedListItem.dataset.nodeId || '');
        event.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            draggedListItem?.classList.add('dragging');
        }, 0);
    }
}

function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
}

function handleDrop(event: DragEvent) {
    event.preventDefault();
    const targetItem = (event.target as HTMLElement).closest('li');
    if (draggedListItem && targetItem && draggedListItem !== targetItem && nodeListElement.contains(targetItem)) {
        const rect = targetItem.getBoundingClientRect();
        const offsetY = event.clientY - rect.top;
        if (offsetY > rect.height / 2) {
            nodeListElement.insertBefore(draggedListItem, targetItem.nextSibling);
        } else {
            nodeListElement.insertBefore(draggedListItem, targetItem);
        }
    }
    draggedListItem?.classList.remove('dragging');
    draggedListItem = null;
}

function handleDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
    draggedListItem = null;
}

// REMOVED handlePlaceNodeStart function
/*
async function handlePlaceNodeStart() {
    if (activeNodeIdLeft === null) {
        alert("Please select a node to place first (usually from the Node List or by clicking it on the graph).");
        return;
    }

    await savePanelChanges('left');

    nodeIdToPlace = activeNodeIdLeft;
    isPlacingNode = true;
    graphContainer.style.cursor = 'crosshair';
    alert("Click on the graph canvas to place the selected node. Connections will be updated after placement.");
}
*/

document.addEventListener('DOMContentLoaded', initializeApp);

export {};
