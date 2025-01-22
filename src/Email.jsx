import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '../src/components/ui/card';
import { Button } from '../src/components/ui/button';
import { Input } from '../src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../src/components/ui/select';

const SortableElement = ({ element, onClick, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: 'transparent',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="mb-4 p-2 border rounded cursor-move"
    >
      {children}
    </div>
  );
};

const EmailBuilder = () => {
    const [elements, setElements] = useState([]);
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [selectedElement, setSelectedElement] = useState(null);
    const [activeId, setActiveId] = useState(null);
  
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );
    
    const elementTypes = [
      { id: 'heading', label: 'Heading' },
      { id: 'paragraph', label: 'Paragraph' },
      { id: 'image', label: 'Image' }
    ];
  
    useEffect(() => {
      fetchLayout();
    }, []);
  
    const fetchLayout = async () => {
      try {
        const response = await fetch('/api/getEmailLayout');
        const data = await response.json();
        setElements(data.elements || []);
      } catch (error) {
        console.error('Error fetching layout:', error);
      }
    };
  
    const handleDragStart = (event) => {
      setActiveId(event.active.id);
    };
  
    const handleDragEnd = (event) => {
      const { active, over } = event;
  
      if (active.id !== over.id) {
        setElements((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
      setActiveId(null);
    };
  
    const addElement = (type) => {
        const newElement = {
          id: `element-${Date.now()}`,
          type,
          content: type === 'heading' ? 'New Heading' : 'New Paragraph',
          style: {
            fontSize: type === 'heading' ? '24px' : '16px',
            color: '#000000',
            textAlign: 'left',
            backgroundColor: 'transparent'
          }
        };
        const updatedElements = [...elements, newElement];
        setElements(updatedElements);
        setSelectedElement(newElement); 
      };


  
    
  
      const handleElementChange = (id, updates) => {
        setElements((prevElements) =>
          prevElements.map((element) =>
            element.id === id
              ? {
                  ...element,
                  ...updates,
                  style: updates.style ? { ...element.style, ...updates.style } : element.style,
                }
              : element
          )
        );
      
        if (selectedElement?.id === id) {
          setSelectedElement((prevSelected) => ({
            ...prevSelected,
            ...updates,
            style: updates.style ? { ...prevSelected.style, ...updates.style } : prevSelected.style,
          }));
        }
      };
  
  
  
    

      const handleImageUpload = async (event, elementId) => {
        const file = event.target.files[0];
        if (!file) return;
      
        const formData = new FormData();
        formData.append('image', file);
      
        try {
          const response = await fetch('http://localhost:4000/api/uploadImage', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
      
          if (data.imageUrl) {
            setElements((prevElements) =>
              prevElements.map((element) =>
                element.id === elementId
                  ? { ...element, imageUrl: data.imageUrl }
                  : element
              )
            );
          } else {
            console.error('Image upload failed:', data);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      };
      
        
         
        
          const downloadTemplate = async () => {
            try {
              const response = await fetch('http://localhost:4000/api/renderAndDownloadTemplate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  backgroundColor,
                  elements
                })
              });
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'email-template.html';
              a.click();
            } catch (error) {
              console.error('Error downloading template:', error);
            }
          };
        
    
    return (
      <div className="p-4">
        <div className="flex gap-4 mb-4">
          {/* Elements Panel */}
          <div className="w-1/4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-bold mb-4">Elements</h3>
                {elementTypes.map(type => (
                  <Button
                    key={type.id}
                    className="w-full mb-2"
                    onClick={() => addElement(type.id)}
                  >
                    Add {type.label}
                  </Button>
                ))}
                <div className="mt-4">
                  <label className="block mb-2">Background Color</label>
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
  
          {/* Preview Panel */}
          <div className="w-1/2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div
                style={{ backgroundColor }}
                className="min-h-[600px] p-4 border rounded"
              >
                <SortableContext
                  items={elements.map(e => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {elements.map((element) => (
                    <SortableElement
                      key={element.id}
                      element={element}
                      onClick={() => setSelectedElement(element)}
                    >
                      {element.type === 'image' ? (
                        <div>
                          {element.imageUrl ? (
                            <img
                              src={element.imageUrl}
                              alt="Uploaded content"
                              className="max-w-full h-auto"
                            />
                          ) : (
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, element.id)}
                            />
                          )}
                        </div>
                      ) : (
                        <div style={element.style}>{element.content}</div>
                      )}
                    </SortableElement>
                  ))}
                </SortableContext>
              </div>
            </DndContext>
          </div>
  
          {/* Style Editor Panel */}
          <div className="w-1/4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-bold mb-4">Style Editor</h3>
                {selectedElement && selectedElement.type !== 'image' && (
                  <div>
                    {/* New Content Editor Section */}
                    <div className="mb-4">
                      <label className="block mb-2">Content</label>
                      <Input
                        type="text"
                        value={selectedElement.content}
                        onChange={(e) => handleElementChange(
                          selectedElement.id,
                          { content: e.target.value }
                        )}
                        className="w-full"
                      />
                    </div>
  
                    <div className="mb-4">
                      <label className="block mb-2">Font Size</label>
                      <Select
                        value={selectedElement.style.fontSize}
                        onValueChange={(value) => handleElementChange(
                          selectedElement.id,
                          { style: { fontSize: value }}
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16px">Normal</SelectItem>
                          <SelectItem value="24px">H3</SelectItem>
                          <SelectItem value="32px">H2</SelectItem>
                          <SelectItem value="40px">H1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
  
                    <div className="mb-4">
                      <label className="block mb-2">Text Color</label>
                      <Input
                        type="color"
                        value={selectedElement.style.color}
                        onChange={(e) => handleElementChange(
                          selectedElement.id,
                          { style: { color: e.target.value }}
                        )}
                      />
                    </div>
  
                    <div className="mb-4">
                      <label className="block mb-2">Text Align</label>
                      <Select
                        value={selectedElement.style.textAlign}
                        onValueChange={(value) => handleElementChange(
                          selectedElement.id,
                          { style: { textAlign: value }}
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select alignment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
  
        <div className="flex justify-end gap-4">
          <Button onClick={downloadTemplate}>Download HTML</Button>
        </div>
      </div>
    );
  };
  
  export default EmailBuilder;
  