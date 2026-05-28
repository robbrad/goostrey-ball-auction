import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReservePriceInput } from "./ReservePriceInput";

describe("ReservePriceInput", () => {
  it("renders an input with the provided value", () => {
    render(<ReservePriceInput value="10.00" onChange={() => {}} itemId={1} />);
    const input = screen.getByLabelText("Reserve price for item 1");
    expect(input).toHaveValue("10.00");
  });

  it("displays validation error for non-numeric input on blur", () => {
    render(<ReservePriceInput value="" onChange={() => {}} itemId={1} />);
    const input = screen.getByLabelText("Reserve price for item 1");

    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);

    expect(screen.getByText(/valid number/i)).toBeInTheDocument();
  });

  it("displays validation error for negative values", () => {
    render(<ReservePriceInput value="" onChange={() => {}} itemId={1} />);
    const input = screen.getByLabelText("Reserve price for item 1");

    fireEvent.change(input, { target: { value: "-5" } });
    fireEvent.blur(input);

    // Negative values don't match the numeric pattern, so they get the "valid number" error
    expect(screen.getByText(/valid number/i)).toBeInTheDocument();
  });

  it("displays validation error for values exceeding 999999.99", () => {
    render(<ReservePriceInput value="" onChange={() => {}} itemId={1} />);
    const input = screen.getByLabelText("Reserve price for item 1");

    fireEvent.change(input, { target: { value: "1000000" } });
    fireEvent.blur(input);

    expect(screen.getByText(/cannot exceed/i)).toBeInTheDocument();
  });

  it("accepts 0.00 as a valid no-reserve value", () => {
    const onChange = vi.fn();
    render(<ReservePriceInput value="" onChange={onChange} itemId={1} />);
    const input = screen.getByLabelText("Reserve price for item 1");

    fireEvent.change(input, { target: { value: "0.00" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(1, "0.00");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onChange with validated value on blur for valid input", () => {
    const onChange = vi.fn();
    render(<ReservePriceInput value="" onChange={onChange} itemId={3} />);
    const input = screen.getByLabelText("Reserve price for item 3");

    fireEvent.change(input, { target: { value: "25.50" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(3, "25.50");
  });

  it("does not call onChange with value on blur when input is invalid", () => {
    const onChange = vi.fn();
    render(<ReservePriceInput value="" onChange={onChange} itemId={1} />);
    const input = screen.getByLabelText("Reserve price for item 1");

    fireEvent.change(input, { target: { value: "notanumber" } });
    fireEvent.blur(input);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange with empty string on blur when input is cleared", () => {
    const onChange = vi.fn();
    render(<ReservePriceInput value="10.00" onChange={onChange} itemId={1} />);
    const input = screen.getByLabelText("Reserve price for item 1");

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(1, "");
  });

  it("adds is-invalid class when there is a validation error", () => {
    render(<ReservePriceInput value="" onChange={() => {}} itemId={1} />);
    const input = screen.getByLabelText("Reserve price for item 1");

    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);

    expect(input).toHaveClass("is-invalid");
  });

  it("clears error when valid input is entered after invalid", () => {
    render(<ReservePriceInput value="" onChange={() => {}} itemId={1} />);
    const input = screen.getByLabelText("Reserve price for item 1");

    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);
    expect(screen.getByText(/valid number/i)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "15.00" } });
    expect(screen.queryByText(/valid number/i)).not.toBeInTheDocument();
  });
});
