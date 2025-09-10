import React, { useState } from "react";

export default function CreateRecipe() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([
    { ingredient: "", quantity: "", unit: "" }
  ]);
  const [instructions, setInstructions] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Helper to update ingredients
  const handleIngredientChange = (idx, field, value) => {
    const updated = ingredients.map((ing, i) =>
      i === idx ? { ...ing, [field]: value } : ing
    );
    setIngredients(updated);
  };

  // Helper to update instructions
  const handleInstructionChange = (idx, value) => {
    const updated = instructions.map((ins, i) => (i === idx ? value : ins));
    setInstructions(updated);
  };

  // Add new ingredient row
  const addIngredient = () => {
    setIngredients([...ingredients, { ingredient: "", quantity: "", unit: "" }]);
  };

  // Add new instruction row
  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  // Remove ingredient row
  const removeIngredient = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  // Remove instruction row
  const removeInstruction = (idx) => {
    setInstructions(instructions.filter((_, i) => i !== idx));
  };

  // Fetch logic to create new recipe
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token"); // Or use context/global state
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/new-recipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          ingredients,
          instructions
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || "Error creating recipe");
      setSuccess("Recipe created successfully!");
      setTitle("");
      setDescription("");
      setIngredients([{ ingredient: "", quantity: "", unit: "" }]);
      setInstructions([""]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Create New Recipe</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Ingredients</label>
          {ingredients.map((ing, idx) => (
            <div className="row mb-2" key={idx}>
              <div className="col">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ingredient"
                  value={ing.ingredient}
                  onChange={e => handleIngredientChange(idx, "ingredient", e.target.value)}
                  required
                />
              </div>
              <div className="col">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Quantity"
                  value={ing.quantity}
                  onChange={e => handleIngredientChange(idx, "quantity", e.target.value)}
                  required
                />
              </div>
              <div className="col">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Unit"
                  value={ing.unit}
                  onChange={e => handleIngredientChange(idx, "unit", e.target.value)}
                  required
                />
              </div>
              <div className="col-auto">
                {ingredients.length > 1 && (
                  <button type="button" className="btn btn-danger" onClick={() => removeIngredient(idx)}>-</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addIngredient}>Add Ingredient</button>
        </div>
        <div className="mb-3">
          <label className="form-label">Instructions</label>
          {instructions.map((ins, idx) => (
            <div className="row mb-2" key={idx}>
              <div className="col">
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Step ${idx + 1}`}
                  value={ins}
                  onChange={e => handleInstructionChange(idx, e.target.value)}
                  required
                />
              </div>
              <div className="col-auto">
                {instructions.length > 1 && (
                  <button type="button" className="btn btn-danger" onClick={() => removeInstruction(idx)}>-</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addInstruction}>Add Instruction</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Recipe"}
        </button>
      </form>
    </div>
  );
}
