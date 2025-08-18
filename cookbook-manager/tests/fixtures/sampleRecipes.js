// Sample recipe data for testing

const sampleRecipeMarkdown = `+++
title = "Chocolate Chip Cookies"
date = "2024-01-15"
tags = ["dessert", "cookies", "easy"]
description = "Classic homemade chocolate chip cookies"
prep_time = "15 minutes"
cook_time = "10 minutes"
total_time = "25 minutes"
servings = "24 cookies"
categories = ["recipes"]
draft = false
+++

## Ingredients

* 2 1/4 cups all-purpose flour
* 1 teaspoon baking soda
* 1 teaspoon salt
* 1 cup butter, softened
* 3/4 cup granulated sugar
* 3/4 cup packed brown sugar
* 2 large eggs
* 2 teaspoons vanilla extract
* 2 cups chocolate chips

## Instructions

1. Preheat oven to 375°F (190°C).
2. In a medium bowl, whisk together flour, baking soda, and salt.
3. In a large bowl, cream together softened butter and both sugars until light and fluffy.
4. Beat in eggs one at a time, then stir in vanilla.
5. Gradually blend in flour mixture.
6. Stir in chocolate chips.
7. Drop rounded tablespoons of dough onto ungreased cookie sheets.
8. Bake for 9-11 minutes or until golden brown.
9. Cool on baking sheet for 2 minutes before removing to wire rack.

## Notes

* For chewier cookies, slightly underbake them.
* Store in airtight container for up to 1 week.`;

const sampleRecipeParsed = {
  filename: 'chocolate-chip-cookies.md',
  frontmatter: {
    title: 'Chocolate Chip Cookies',
    date: '2024-01-15',
    tags: ['dessert', 'cookies', 'easy'],
    description: 'Classic homemade chocolate chip cookies',
    prep_time: '15 minutes',
    cook_time: '10 minutes',
    total_time: '25 minutes',
    servings: '24 cookies',
    categories: ['recipes'],
    draft: false
  },
  content: `## Ingredients

* 2 1/4 cups all-purpose flour
* 1 teaspoon baking soda
* 1 teaspoon salt
* 1 cup butter, softened
* 3/4 cup granulated sugar
* 3/4 cup packed brown sugar
* 2 large eggs
* 2 teaspoons vanilla extract
* 2 cups chocolate chips

## Instructions

1. Preheat oven to 375°F (190°C).
2. In a medium bowl, whisk together flour, baking soda, and salt.
3. In a large bowl, cream together softened butter and both sugars until light and fluffy.
4. Beat in eggs one at a time, then stir in vanilla.
5. Gradually blend in flour mixture.
6. Stir in chocolate chips.
7. Drop rounded tablespoons of dough onto ungreased cookie sheets.
8. Bake for 9-11 minutes or until golden brown.
9. Cool on baking sheet for 2 minutes before removing to wire rack.

## Notes

* For chewier cookies, slightly underbake them.
* Store in airtight container for up to 1 week.`
};

const sampleRecipeList = [
  {
    filename: 'chocolate-chip-cookies.md',
    title: 'Chocolate Chip Cookies',
    date: '2024-01-15',
    tags: ['dessert', 'cookies', 'easy'],
    description: 'Classic homemade chocolate chip cookies',
    draft: false,
    modified: new Date('2024-01-15')
  },
  {
    filename: 'spaghetti-carbonara.md',
    title: 'Spaghetti Carbonara',
    date: '2024-01-10',
    tags: ['pasta', 'italian', 'dinner'],
    description: 'Authentic Italian carbonara recipe',
    draft: false,
    modified: new Date('2024-01-10')
  },
  {
    filename: 'chicken-tikka-masala.md',
    title: 'Chicken Tikka Masala',
    date: '2024-01-05',
    tags: ['indian', 'curry', 'chicken', 'dinner'],
    description: 'Creamy and flavorful chicken tikka masala',
    draft: false,
    modified: new Date('2024-01-05')
  }
];

const invalidRecipeMarkdown = `+++
# This is invalid TOML - missing quotes and wrong format
title = Broken Recipe
date = not-a-date
tags = [broken, tags]
+++

This is a recipe with invalid frontmatter.`;

const sampleFormData = {
  title: 'Test Recipe',
  description: 'A test recipe for unit testing',
  date: '2024-01-20',
  tags: 'test, unit, sample',
  prep_time: '5 minutes',
  cook_time: '10 minutes',
  total_time: '15 minutes',
  servings: '2',
  content: '## Ingredients\n\n* Test ingredient\n\n## Instructions\n\n1. Test instruction'
};

module.exports = {
  sampleRecipeMarkdown,
  sampleRecipeParsed,
  sampleRecipeList,
  invalidRecipeMarkdown,
  sampleFormData
};
