pragma solidity ^0.4.24;

contract CurrentRebalance {
    address public owner;

    // Is `false` if contract is either in update process or if marked as invalid
    // (due to error with one of the updating transactions, etc.)
    bool public isInValidState;

    // Floating-point definitions - used to convert between floating-point and integer numbers.
    // Individual asset decimals
    uint32 public constant WEIGHT_DECIMALS = 2;
    // Rebalance metadata decimals
    uint32 public constant INCEPTION_VALUE_DECIMALS = 4;
    uint32 public constant MODEL_VALUE_DECIMALS = 4;
    uint32 public constant MARKET_CAP_COVERAGE_DECIMALS = 2;

    // We are using explict internal variables + getters so we can restrict
    // data reading with modifiers
    bool internal isCurrentlyUpdating;
    uint internal constituentCount; // Number of assets in the asset distribution
    RebalanceMetadata internal rebalanceMetadata;
    mapping(uint32 => AssetDistributionItem) internal assetDistribution;
    bytes internal documentHash; // External file fingerprint (md5)
    bytes internal documentUrl; // External file location

    modifier restricted {
        require(
            msg.sender == owner,
            "Only the owner can call this function."
        );
        _;
    }

    // Allow owner to read contract state for debugging.
    modifier isReadable {
        require(
            isInValidState || msg.sender == owner,
            "Contract is marked not currently readable, may be updating."
        );
        _;
    }

    modifier isUpdating {
        require(
            isCurrentlyUpdating,
            "Must call initiateUpdate() prior to calling an update method."
        );
        _;
    }


    // Emit new model version on successful update
    event ContractUpdated(uint indexed modelVersion);


    // Metadata for current rebalance
    struct RebalanceMetadata {
        uint32 inceptionTimestamp;
        uint32 priceCloseTimestamp;
        uint32 rebalanceTimestamp;
        uint32 modelVersion;
        uint32 inceptionValue;
        uint modelValue;
        uint totalMarketCap;
        uint32 marketCapCoverage;
    }

    struct AssetDistributionItem {
        bytes coinId;
        bytes name;
        uint marketCap;
        uint32 weight;
    }


    constructor() public {
        owner = msg.sender;

        isInValidState = false;
        isCurrentlyUpdating = false;
        constituentCount = 0;
    }

    // TODO: Probably good idea to refactor this to allow entering update state
    // without wiping out asset distribution (partial vs full update).
    function initiateUpdate() external restricted {
        isInValidState = false;
        isCurrentlyUpdating = true;

        // Clear existing asset distribution.
        // This seems expensive for large distributions but is less expensive than the
        // alternative; comparing old/new distribution entries, removing those that
        // don't exist in the new distribution, etc.
        for (uint32 i = 0; i < constituentCount; i++) {
            delete assetDistribution[i];
        }

        // Reset constituentCount
        constituentCount = 0;
    }

    function concludeSuccessfulUpdate() external restricted isUpdating {
        isInValidState = true;
        isCurrentlyUpdating = false;

        emit ContractUpdated(rebalanceMetadata.modelVersion);
    }

    function concludeUnsuccessfulUpdate() external restricted isUpdating {
        isInValidState = false;
        isCurrentlyUpdating = false;
    }

    function getConstituentCount() external view isReadable returns (uint) {
        return constituentCount;
    }

    function setAssetDistributionRow(
        uint32 index,
        bytes coinId,
        bytes name,
        uint marketCap,
        uint32 weight
    ) external restricted isUpdating {
        AssetDistributionItem memory item = AssetDistributionItem({
            coinId: coinId,
            name: name,
            marketCap: marketCap,
            weight: weight
        });

        assetDistribution[index] = item;
        constituentCount++;
    }

    // External users should iterate over the range of `constituentCount` to retrieve asset
    // distribution rows by index.
    function getAssetDistributionRow(uint32 index) external view isReadable returns(bytes, bytes, uint, uint32) {
        AssetDistributionItem memory row = assetDistribution[index];

        return (
            row.coinId,
            row.name,
            row.marketCap,
            row.weight
        );
    }

    function setRebalanceMetadata(
        uint32 inceptionTimestamp,
        uint32 priceCloseTimestamp,
        uint32 rebalanceTimestamp,
        uint32 modelVersion,
        uint32 inceptionValue,
        uint modelValue,
        uint totalMarketCap,
        uint32 marketCapCoverage
    ) external restricted isUpdating {
        rebalanceMetadata = RebalanceMetadata({
            inceptionTimestamp: inceptionTimestamp,
            priceCloseTimestamp: priceCloseTimestamp,
            rebalanceTimestamp: rebalanceTimestamp,
            modelVersion: modelVersion,
            inceptionValue: inceptionValue,
            modelValue: modelValue,
            totalMarketCap: totalMarketCap,
            marketCapCoverage: marketCapCoverage
        });
    }

    function getRebalanceMetadata() external view isReadable returns(
        uint32, uint32, uint32, uint32, uint32, uint, uint, uint32
    ) {
        return (
            rebalanceMetadata.inceptionTimestamp,
            rebalanceMetadata.priceCloseTimestamp,
            rebalanceMetadata.rebalanceTimestamp,
            rebalanceMetadata.modelVersion,
            rebalanceMetadata.inceptionValue,
            rebalanceMetadata.modelValue,
            rebalanceMetadata.totalMarketCap,
            rebalanceMetadata.marketCapCoverage
        );
    }

    function setDocumentHash(bytes fingerprint) external restricted isUpdating {
        documentHash = fingerprint;
    }

    function getDocumentHash() external view isReadable returns(bytes) {
        return documentHash;
    }

    function setDocumentUrl(bytes url) external restricted isUpdating {
        documentUrl = url;
    }

    function getDocumentUrl() external view isReadable returns(bytes) {
        return documentUrl;
    }
}
