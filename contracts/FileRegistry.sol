// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FileRegistry {
    // Mapping from an owner's address to a list of their file CIDs
    mapping(address => string[]) private _files;

    event FileAdded(address indexed owner, string cid);

    /**
     * @dev Adds a new file CID to the sender's list of files.
     * @param cid The IPFS content identifier (CID) of the file.
     */
    function addFile(string memory cid) public {
        _files[msg.sender].push(cid);
        emit FileAdded(msg.sender, cid);
    }

    /**
     * @dev Retrieves the list of file CIDs for a given address.
     * @param owner The address of the file owner.
     * @return A list of IPFS CIDs.
     */
    function getFiles(address owner) public view returns (string[] memory) {
        return _files[owner];
    }
}