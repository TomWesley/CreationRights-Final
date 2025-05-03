// src/data/mockCreations.js

// Array of mock creations with detailed metadata for each type
const mockCreations = [
    // ======== PHOTOGRAPHY / IMAGES ========
    {
      id: "CR-1234567890-img1",
      title: "Sunset over Manhattan Skyline",
      type: "Image",
      dateCreated: "2024-03-15",
      rights: "© 2024 Jane Smith Photography. All rights reserved. Licensed for display only.",
      notes: "Captured from Brooklyn Bridge Park using Sony A7R IV with 24-70mm f/2.8 lens.",
      licensingCost: "299.99",
      tags: ["skyline", "sunset", "cityscape", "manhattan", "architecture", "new york"],
      fileSize: "24.3 MB",
      fileType: "image/jpeg",
      fileName: "manhattan_sunset_4k.jpg",
      status: "published",
      createdBy: "jane.smith@photography.com",
      fileUrl: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=300&q=80",
      metadata: {
        category: "Photography",
        creationRightsId: "CR-1234567890-img1",
        photographer: "Jane Smith",
        createdDate: "2024-03-15",
        dimensions: "5760x3840",
        style: "Landscape",
        equipment: "Sony A7R IV",
        lens: "Sony 24-70mm f/2.8",
        iso: "100",
        shutterspeed: "1/125",
        aperture: "f/8",
        location: "Brooklyn Bridge Park, New York",
        collection: "Urban Landscapes",
        rightsHolders: "Jane Smith Photography LLC"
      }
    },
    {
      id: "CR-1234567891-img2",
      title: "Abstract Geometric Patterns",
      type: "Image",
      dateCreated: "2024-02-10",
      rights: "Licensed under Creative Commons Attribution 4.0 International License",
      notes: "Digital artwork created using Adobe Illustrator and Photoshop.",
      licensingCost: "149.50",
      tags: ["abstract", "geometric", "digital art", "patterns", "minimalist"],
      fileSize: "12.7 MB",
      fileType: "image/png",
      fileName: "geometric_abstract_art.png",
      status: "published",
      createdBy: "michael.chen@artworks.com",
      fileUrl: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=300&q=80",
      metadata: {
        category: "Photography",
        creationRightsId: "CR-1234567891-img2",
        photographer: "Michael Chen",
        createdDate: "2024-02-10",
        dimensions: "4000x4000",
        style: "Abstract",
        software: "Adobe Creative Suite",
        colors: "Blue, Orange, Purple, Green",
        collection: "Geometric Abstraction Series",
        rightsHolders: "Michael Chen"
      }
    },
    {
      id: "CR-1234567892-img3",
      title: "Wildlife Portrait: Bengal Tiger",
      type: "Image",
      dateCreated: "2023-11-25",
      rights: "All rights reserved. Commercial use requires written permission.",
      notes: "Captured during wildlife expedition in Ranthambore National Park, India.",
      licensingCost: "749.00",
      tags: ["wildlife", "tiger", "portrait", "nature", "endangered species", "feline"],
      fileSize: "32.6 MB",
      fileType: "image/jpeg",
      fileName: "bengal_tiger_portrait.jpg",
      status: "published",
      createdBy: "david.wilson@wildlifephoto.org",
      fileUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=300&q=80",
      metadata: {
        category: "Photography",
        creationRightsId: "CR-1234567892-img3",
        photographer: "David Wilson",
        createdDate: "2023-11-25",
        dimensions: "6016x4016",
        style: "Wildlife",
        equipment: "Canon EOS R5",
        lens: "Canon EF 600mm f/4L IS III USM",
        iso: "800",
        shutterspeed: "1/1000",
        aperture: "f/5.6",
        location: "Ranthambore National Park, India",
        collection: "Endangered Species Series",
        rightsHolders: "David Wilson Photography"
      }
    },
    
];

// Export the array correctly - this is the key fix
export default mockCreations;