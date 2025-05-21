import React from 'react';

export default function FixedTopicInput({ topic, setTopic, darkMode }) {
  // Just use simple state with direct string values
  const [person, setPerson] = React.useState("");
  const [about, setAbout] = React.useState("");
  
  React.useEffect(() => {
    // Just extract person and about directly
    try {
      if (topic) {
        if (topic.includes("PERSON:") && topic.includes("ABOUT:")) {
          const personPart = topic.split("ABOUT:")[0];
          const personValue = personPart.replace("PERSON:", "").replace(",", "").trim();
          const aboutValue = topic.split("ABOUT:")[1].trim();
          
          setPerson(personValue);
          setAbout(aboutValue);
        }
      }
    } catch (e) {
      console.error("Error parsing topic", e);
    }
  }, [topic]);
  
  return (
    <div>
      <div style={{marginBottom: 16}}>
        <label style={{display: 'block', marginBottom: 6, fontSize: 13, color: darkMode ? '#aaa' : '#666'}}>
          You will be talking to...
        </label>
        <input 
          value={person}
          onChange={(e) => {
            const newPerson = e.target.value;
            setPerson(newPerson);
            setTopic(`PERSON: ${newPerson}, ABOUT: ${about}`);
          }}
          placeholder="Who will you be talking to?"
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: darkMode ? '1px solid #444' : '1px solid #ccc',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#fff' : '#333',
            boxSizing: 'border-box'
          }}
        />
      </div>
      
      <div>
        <label style={{display: 'block', marginBottom: 6, fontSize: 13, color: darkMode ? '#aaa' : '#666'}}>
          And then about...
        </label>
        <input 
          value={about}
          onChange={(e) => {
            const newAbout = e.target.value;
            setAbout(newAbout);
            setTopic(`PERSON: ${person}, ABOUT: ${newAbout}`);
          }}
          placeholder="What will the conversation be about?"
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: darkMode ? '1px solid #444' : '1px solid #ccc',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#fff' : '#333',
            boxSizing: 'border-box'
          }}
        />
      </div>
    </div>
  );
}
