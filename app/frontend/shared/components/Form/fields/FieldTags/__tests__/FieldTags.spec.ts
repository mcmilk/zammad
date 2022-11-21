// Copyright (C) 2012-2022 Zammad Foundation, https://zammad-foundation.org/

import { FormKit } from '@formkit/vue'
import { getByText, queryByRole } from '@testing-library/vue'
import { renderComponent } from '@tests/support/components'
import { getByIconName } from '@tests/support/components/iconQueries'
import type { FieldTagsProps } from '../types'

const defaultTags = [
  { label: 'test', value: 'test' },
  { label: 'support', value: 'support' },
  { label: 'paid', value: 'paid' },
]

const renderFieldTags = (props: Partial<FieldTagsProps> = {}) =>
  renderComponent(FormKit, {
    form: true,
    formField: true,
    dialog: true,
    props: {
      type: 'tags',
      name: 'tags',
      label: 'Tags',
      options: defaultTags,
      ...props,
    },
  })

beforeAll(async () => {
  await import('../FieldTagsDialog.vue')
})

describe('Form - Field - Tags', () => {
  it('renders field', async () => {
    const view = renderFieldTags()

    const node = view.getByLabelText('Tags')

    expect(queryByRole(node, 'list')).not.toBeInTheDocument()

    await view.events.click(node)

    expect(view.getByPlaceholderText('Tag name…')).toBeInTheDocument()

    const options = view.getAllByRole('option')

    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('paid')
    expect(options[1]).toHaveTextContent('support')
    expect(options[2]).toHaveTextContent('test')

    await view.events.click(options[0])
    await view.events.click(options[1])

    expect(
      getByIconName(options[0], 'mobile-check-box-yes'),
    ).toBeInTheDocument()

    expect(
      getByIconName(options[1], 'mobile-check-box-yes'),
    ).toBeInTheDocument()

    await view.events.click(view.getByRole('button', { name: 'Done' }))

    expect(getByText(node, 'paid')).toBeInTheDocument()
    expect(getByText(node, 'support')).toBeInTheDocument()
  })

  it('can deselect tags', async () => {
    const view = renderFieldTags()

    const node = view.getByLabelText('Tags')
    await view.events.click(node)

    const options = view.getAllByRole('option')

    await view.events.click(options[0])

    await view.events.click(view.getByRole('button', { name: 'Done' }))

    expect(node, 'has selected tags').toHaveTextContent('paid')

    await view.events.click(node)

    const newOptions = view.getAllByRole('option')

    await view.events.click(newOptions[0])
    await view.events.click(view.getByRole('button', { name: 'Done' }))

    expect(queryByRole(node, 'list')).not.toBeInTheDocument()
  })

  it('filters options', async () => {
    const view = renderFieldTags()

    const node = view.getByLabelText('Tags')
    await view.events.click(node)

    const filterInput = view.getByPlaceholderText('Tag name…')

    await view.events.type(filterInput, 'paid')

    const options = view.getAllByRole('option')

    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent('paid')

    expect(
      view.queryByTitle('Create tag'),
      "can't create, because prop is false",
    ).not.toBeInTheDocument()
  })

  it("can't add existing tag", async () => {
    const view = renderFieldTags({ canCreate: true })

    const node = view.getByLabelText('Tags')
    await view.events.click(node)

    const filterInput = view.getByPlaceholderText('Tag name…')

    await view.events.type(filterInput, 'paid')

    const createButton = view.getByTitle('Create tag')

    expect(createButton).toBeDisabled()
    await view.events.click(createButton)

    // TODO api not called
  })

  it('can select new tag, when creating existing one', async () => {
    const view = renderFieldTags({ canCreate: true })

    const node = view.getByLabelText('Tags')
    await view.events.click(node)

    const filterInput = view.getByPlaceholderText('Tag name…')

    await view.events.type(filterInput, 'paid{Tab}')

    const option = view.getByRole('option', { name: 'paid' })
    expect(option).toBeChecked()
    expect(option).toHaveAttribute('aria-selected', 'true')

    expect(filterInput, 'resets input').toHaveDisplayValue('')
  })

  it("clicking disabled field doesn't select dialog", async () => {
    const wrapper = renderFieldTags({ disabled: true })

    await wrapper.events.click(wrapper.getByLabelText('Tags'))

    expect(wrapper.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clicking select without options opens select dialog', async () => {
    const wrapper = renderFieldTags({ options: [] })

    await wrapper.events.click(wrapper.getByLabelText('Tags'))

    expect(wrapper.queryByRole('dialog')).toBeInTheDocument()
  })

  it('restores focus on close', async () => {
    const wrapper = renderFieldTags({ options: [] })

    const tagsButton = wrapper.getByLabelText('Tags')

    await wrapper.events.click(tagsButton)

    expect(tagsButton).not.toHaveFocus()

    await wrapper.events.click(wrapper.getByRole('button', { name: 'Done' }))

    expect(tagsButton).toHaveFocus()
  })

  it('can traverse options with keyboard', async () => {
    const wrapper = renderFieldTags()

    const tagsButton = wrapper.getByLabelText('Tags')

    await wrapper.events.click(tagsButton)
    await wrapper.events.keyboard('{Tab}')

    const options = wrapper.getAllByRole('option')
    expect(options[0]).toHaveFocus()

    await wrapper.events.keyboard('{ArrowDown}')
    expect(options[1]).toHaveFocus()

    await wrapper.events.keyboard('{ArrowDown}')
    expect(options[2]).toHaveFocus()

    await wrapper.events.keyboard('{ArrowDown}')
    expect(options[0]).toHaveFocus()

    await wrapper.events.keyboard('{ArrowUp}')
    expect(options[2]).toHaveFocus()

    await wrapper.events.keyboard('{ArrowUp}')
    expect(options[1]).toHaveFocus()
  })
})

describe('creating new tag', () => {
  it('can add new tag on click', async () => {
    const view = renderFieldTags({ canCreate: true })

    const node = view.getByLabelText('Tags')
    await view.events.click(node)

    const filterInput = view.getByPlaceholderText('Tag name…')

    await view.events.type(filterInput, 'pay')

    const createButton = view.getByTitle('Create tag')

    expect(createButton).toBeEnabled()
    await view.events.click(createButton)

    expect(view.getByRole('option', { name: 'pay' })).toBeInTheDocument()
    expect(filterInput).toHaveFocus()
  })

  it.each(['{Enter}', '{Tab}', ','])(
    'can add new tag with "%s" key',
    async (key) => {
      const view = renderFieldTags({ canCreate: true })

      const node = view.getByLabelText('Tags')
      await view.events.click(node)

      const filterInput = view.getByPlaceholderText('Tag name…')

      await view.events.type(filterInput, `pay${key}`)

      expect(view.getByRole('option', { name: 'pay' })).toBeInTheDocument()
      expect(filterInput).toHaveDisplayValue('')
    },
  )

  it('cannot input comma', async () => {
    const view = renderFieldTags({ canCreate: true })

    const node = view.getByLabelText('Tags')
    await view.events.click(node)

    const filterInput = view.getByPlaceholderText('Tag name…')

    await view.events.type(filterInput, `,{Enter}`)

    expect(view.queryByRole('option', { name: ',' })).not.toBeInTheDocument()
    expect(filterInput).toHaveDisplayValue('')
  })
})
