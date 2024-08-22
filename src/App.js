import './App.css';
import { useState } from 'react';
import { Participant } from "./Participant";

function App() {

  const [participant, setParticipant] = useState({});
  const [listParticipants, setListParticipants] = useState([]);

  const handleParticipant = (event) => {
    setParticipant(event.target.value);
  }

  const addParticipant = () => {
     const participantObject = {
      id: listParticipants.length === 0 ? 1: listParticipants[listParticipants.length - 1].id + 1,
      name: participant
     }
     setListParticipants([...listParticipants, participantObject]);
  }

  const deleteParticipant = (participant) => {
    const newListParticipants = listParticipants.filter((e) => {
      if(participant!==e.id) {return e;}
    })
    setListParticipants(newListParticipants); 
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Torneos
        </p>
        <input onChange={handleParticipant}></input>
        <button onClick={addParticipant}>Agregar</button>
        {
          listParticipants.map((participant) => {
            return <Participant 
                      name={participant.name} 
                      id={participant.id} 
                      deleteParticipant={deleteParticipant} />;
          })
        }
      </header>
    </div>
  );
}

export default App;
