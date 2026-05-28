import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FilterPanel from "./FilterPanel";

const defaultFilterState = {
  searchText: "",
  status: "all",
  priceMin: null,
  priceMax: null,
  endingSoon: false,
};

describe("FilterPanel", () => {
  it("renders all filter controls", () => {
    render(<FilterPanel filterState={defaultFilterState} onChange={() => {}} />);

    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText(/Min/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max/)).toBeInTheDocument();
    expect(screen.getByLabelText("Ending soon")).toBeInTheDocument();
  });

  it("displays current filterState values", () => {
    const state = {
      searchText: "golf",
      status: "active",
      priceMin: 10,
      priceMax: 100,
      endingSoon: true,
    };
    render(<FilterPanel filterState={state} onChange={() => {}} />);

    expect(screen.getByLabelText("Search")).toHaveValue("golf");
    expect(screen.getByLabelText("Status")).toHaveValue("active");
    expect(screen.getByLabelText(/Min/)).toHaveValue(10);
    expect(screen.getByLabelText(/Max/)).toHaveValue(100);
    expect(screen.getByLabelText("Ending soon")).toBeChecked();
  });

  it("calls onChange with updated searchText on text input change", () => {
    const onChange = vi.fn();
    render(<FilterPanel filterState={defaultFilterState} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "spa" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      searchText: "spa",
    });
  });

  it("calls onChange with updated status on dropdown change", () => {
    const onChange = vi.fn();
    render(<FilterPanel filterState={defaultFilterState} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "ended" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      status: "ended",
    });
  });

  it("calls onChange with updated priceMin on min input change", () => {
    const onChange = vi.fn();
    render(<FilterPanel filterState={defaultFilterState} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Min/), {
      target: { value: "25" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      priceMin: 25,
    });
  });

  it("calls onChange with null priceMin when input is cleared", () => {
    const onChange = vi.fn();
    const state = { ...defaultFilterState, priceMin: 25 };
    render(<FilterPanel filterState={state} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Min/), {
      target: { value: "" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...state,
      priceMin: null,
    });
  });

  it("calls onChange with updated priceMax on max input change", () => {
    const onChange = vi.fn();
    render(<FilterPanel filterState={defaultFilterState} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/Max/), {
      target: { value: "200" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      priceMax: 200,
    });
  });

  it("calls onChange with updated endingSoon on toggle change", () => {
    const onChange = vi.fn();
    render(<FilterPanel filterState={defaultFilterState} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Ending soon"));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultFilterState,
      endingSoon: true,
    });
  });

  it("uses Bootstrap form-control class on text and number inputs", () => {
    render(<FilterPanel filterState={defaultFilterState} onChange={() => {}} />);

    expect(screen.getByLabelText("Search")).toHaveClass("form-control");
    expect(screen.getByLabelText(/Min/)).toHaveClass("form-control");
    expect(screen.getByLabelText(/Max/)).toHaveClass("form-control");
  });

  it("uses Bootstrap form-select class on status dropdown", () => {
    render(<FilterPanel filterState={defaultFilterState} onChange={() => {}} />);

    expect(screen.getByLabelText("Status")).toHaveClass("form-select");
  });

  it("uses Bootstrap form-check-input class on ending soon checkbox", () => {
    render(<FilterPanel filterState={defaultFilterState} onChange={() => {}} />);

    expect(screen.getByLabelText("Ending soon")).toHaveClass("form-check-input");
  });
});
